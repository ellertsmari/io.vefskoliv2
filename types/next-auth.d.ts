import type { AdapterUser as BaseAdapterUser } from "next-auth/adapters";

declare module "@auth/core/adapters" {
  interface AdapterUser extends BaseAdapterUser {
    avatarUrl: string | null | undefined;
    background: string | null | undefined;
    careerGoals: string | null | undefined;
    createdAt: Date | null | undefined;
    email: string | null | undefined;
    favoriteArtists: string | null | undefined;
    interests: string | null | undefined;
    name: string | null | undefined;
    role: string | null | undefined;
  }
}

// import 'next-auth';
// import { JWT } from 'next-auth/jwt';

// declare module 'next-auth' {
//   interface Session {
//     user: {
//       id: string;
//       email: string;
//       background: string;
//       // Add any other custom properties here
//     };
//   }

//   interface User {
//     background: string;
//     // Add any other custom properties here
//   }
// }

// declare module 'next-auth/jwt' {
//   interface JWT {
//     background?: string;
//     // Add any other custom properties here
//   }
// }
