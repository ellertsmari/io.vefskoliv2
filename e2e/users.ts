import seedData from "./seed.cjs";

export const { IDS, PASSWORD, USERS } = seedData;

export type Role = keyof typeof USERS;

/** Where each seeded user's signed-in browser state is kept between tests. */
export const storageState = (role: Role) => `e2e/.auth/${role}.json`;
