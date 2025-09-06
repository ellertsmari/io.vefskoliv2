import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { UserDocument } from "models/user";
import { User } from "models/user";
import bcrypt from "bcrypt";
import { connectToDatabase } from "serverActions/mongoose-connector";

export async function getUser(email: string): Promise<UserDocument | null> {
  try {
    await connectToDatabase();
    const user: UserDocument | null = await User.findOne({ email });
    return user;
  } catch (error) {
    throw new Error("Failed to fetch user.");
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) return user;
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      // If this is the first time the JWT callback is called (on sign in)
      if (user) {
        try {
          await connectToDatabase();
          const dbuser: UserDocument | null = await User.findOne({
            email: user.email,
          });
          
          if (dbuser) {
            // Store all user data in the token to avoid database lookups in session callback
            token.id = dbuser.id.toString();
            token.role = dbuser.role;
            token.avatarUrl = dbuser.avatarUrl;
            token.background = dbuser.background;
            token.careerGoals = dbuser.careerGoals;
            token.email = dbuser.email;
            token.favoriteArtists = dbuser.favoriteArtists;
            token.interests = dbuser.interests;
            token.name = dbuser.name;
          }
        } catch (error) {
          console.error("Error in JWT callback:", error);
          // Return token as-is if database lookup fails
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Use data from the token instead of making database calls
      if (token && session.user) {
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
        };
      }
      return session;
    },
  },
});
