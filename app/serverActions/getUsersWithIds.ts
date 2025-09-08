"use server";
import { User, UserWithIdType } from "models/user";
import { FilterQuery } from "mongoose";
import { connectToDatabase } from "./mongoose-connector";

type UserForReports = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export const getUsersWithIds = async (
  filter: FilterQuery<any> = {}
): Promise<UserForReports[]> => {
  await connectToDatabase();
  const usersJSON = await User.find(filter);
  const users = JSON.parse(JSON.stringify(usersJSON)) as UserWithIdType[];

  const usersForReports = users.map((user) => ({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  }));
  
  return usersForReports;
};