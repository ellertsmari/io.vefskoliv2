import type { AdapterUser as BaseAdapterUser } from "next-auth/adapters";
import type { UserType } from "models/user";

declare module "@auth/core/adapters" {
  interface AdapterUser
    extends BaseAdapterUser,
      Omit<UserType, "_id" | "password" | "createdAt" | "updatedAt"> {}
}

declare module "next-auth" {
  interface User {
    role: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      avatarUrl?: string;
      background?: string;
      careerGoals?: string;
      favoriteArtists?: string;
      interests?: string;
      image?: string | null;
      emailVerified?: Date | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    avatarUrl?: string;
    background?: string;
    careerGoals?: string;
    favoriteArtists?: string;
    interests?: string;
  }
}
