import NextAuth, { type Session } from "next-auth";
import { cache } from "react";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { UserDocument } from "models/user";
import { User } from "models/user";
import { connectToDatabase } from "serverActions/mongoose-connector";
import { cookies } from "next/headers";
import { verifyCredentials } from "app/lib/credentials";
import { getClientIp } from "app/lib/clientIp";
import { refreshToken, snapshotUser } from "app/lib/sessionToken";

/**
 * How long a signed-in browser stays signed in without visiting, and how
 * often a visit extends that. A week covers a normal study rhythm; a token
 * that goes untouched for longer than that is more likely a forgotten
 * library computer than a student.
 */
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const SESSION_UPDATE_AGE_SECONDS = 60 * 60;

const nextAuth = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        // Six, not eight: accounts from before sign-up required eight still
        // have to be able to log in.
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;
        return verifyCredentials({ email, password, ip: await getClientIp() });
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  secret: process.env.AUTH_SECRET,

  callbacks: {
    async jwt({ token, user, trigger }) {
      // First call, right after `authorize` succeeded.
      if (user) {
        try {
          await connectToDatabase();
          const dbuser: UserDocument | null = await User.findOne({
            email: user.email,
          });
          if (dbuser) snapshotUser(token, dbuser);
        } catch (error) {
          console.error("Error in JWT callback:", error);
          // Return token as-is if database lookup fails
        }
        return token;
      }

      // `updateSession()` after a profile save: re-read right away so the
      // header shows the new picture without waiting for the next check.
      if (trigger === "update") token.checkedAt = 0;

      // Later calls: every so often re-read the user, and drop the session
      // if the account is gone or no longer active.
      return refreshToken(token);
    },
    async session({ session, token }) {
      // Use data from the token instead of making database calls
      if (token && session.user) {
        // Check for alias cookie
        const cookieStore = await cookies();
        const aliasedUserId = cookieStore.get('aliased-user')?.value;

        // If teacher has set an alias, override the session with the aliased user
        if (aliasedUserId && token.role === "teacher") {
          try {
            await connectToDatabase();
            const aliasUser = await User.findById(aliasedUserId);

            if (aliasUser) {
              session.user = {
                ...session.user,
                id: aliasUser.id.toString(),
                role: aliasUser.role,
                avatarUrl: aliasUser.avatarUrl,
                background: aliasUser.background,
                careerGoals: aliasUser.careerGoals,
                email: aliasUser.email,
                favoriteArtists: aliasUser.favoriteArtists,
                interests: aliasUser.interests,
                name: aliasUser.name,
                isAliased: true,
                aliasedUserId: aliasUser.id.toString(),
                originalUser: {
                  id: token.id as string,
                  role: token.role as string,
                  avatarUrl: token.avatarUrl as string | undefined,
                  background: token.background as string | undefined,
                  careerGoals: token.careerGoals as string | undefined,
                  email: token.email as string,
                  favoriteArtists: token.favoriteArtists as string | undefined,
                  interests: token.interests as string | undefined,
                  name: token.name as string,
                },
              };
            }
          } catch (error) {
            console.error("Error loading alias user:", error);
          }
        } else {
          // Normal user session
          session.user = {
            ...session.user,
            id: token.id as string,
            role: token.role as string,
            avatarUrl: token.avatarUrl as string | undefined,
            background: token.background as string | undefined,
            careerGoals: token.careerGoals as string | undefined,
            email: token.email as string,
            favoriteArtists: token.favoriteArtists as string | undefined,
            interests: token.interests as string | undefined,
            name: token.name as string,
            isAliased: false,
            aliasedUserId: undefined,
            originalUser: undefined,
          };
        }
      }
      return session;
    },
  },
});

export const { handlers, signIn, signOut } = nextAuth;

/**
 * One session read per render. A guide page asks for the session about five
 * times (layout, page, loaders) and the calendar about seven; each call
 * decodes the token, and re-reads the user from the database once the token
 * is older than the re-validation window or a teacher is viewing as a student.
 *
 * The cache is keyed on the request's cookies, not just on "this request": a
 * server action that switches the alias or re-issues the session cookie
 * changes the key, so the next `auth()` in that same request reads again.
 */
const readSession = cache((_cookieKey: string): Promise<Session | null> =>
  nextAuth.auth()
);

export const auth = async (): Promise<Session | null> =>
  readSession((await cookies()).toString());

/**
 * Re-issue the session cookie from the database. Only callable where cookies
 * can be written (server actions, route handlers). The jwt callback treats
 * the "update" trigger as "read the user again now".
 */
export const updateSession = nextAuth.unstable_update;
