import { OptionalUserInfoKeys } from "constants/userInfo";

export type ShareableUserInfo = Partial<{
  [key in OptionalUserInfoKeys]: string;
}> & {
  name: string;
};
