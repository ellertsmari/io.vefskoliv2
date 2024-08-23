import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { UserDocument } from "./app/models/user";
import { User } from "./app/models/user";
import bcrypt from "bcrypt";
import { connectToDatabase } from "./app/utils/mongoose-connector";
import { AdapterUser } from "next-auth/adapters";

export async function getUser(email: string): Promise<UserDocument | null> {
  try {
    connectToDatabase();
    console.log("fetching user");
    const user: UserDocument | null = await User.findOne({ email });
    console.log("user fetched!", user);
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
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
          console.log("user", user);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);
          console.log("passwordsMatch", passwordsMatch);
          if (passwordsMatch) return user;
        }
        console.log("Invalid credentials");
        return null;
      },
    }),
  ],

  callbacks: {
    async session({ session }) {
      const dbuser: UserDocument | null = await User.findOne({
        email: session.user.email,
      });
      //add user to session
      if (!dbuser) {
        return session;
      }
      //@ts-ignore
      const {
        avatarUrl,
        background,
        careerGoals,
        createdAt,
        email,
        favoriteArtists,
        interests,
        name,
        role,
      } = dbuser;
      const id = dbuser.id.toString();
      const emailVerified = new Date();

      session.user = {
        avatarUrl,
        background,
        careerGoals,
        createdAt,
        email,
        favoriteArtists,
        interests,
        name,
        role,
        id,
        emailVerified,
      };
      console.log("this is the user: ", session);

      return session;
    },
  },
});
