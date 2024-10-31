"use server";
import { User, UserDocument } from "models/user";
import { FilterQuery } from "mongoose";
import { connectToDatabase } from "../clientActions/mongoose-connector";

export const getUsers = async (filter: FilterQuery<any>) => {
  await connectToDatabase();
  const users = await User.find(filter);

  return JSON.parse(JSON.stringify(users)) as UserDocument[];
};
