import {
  Document,
  Schema,
  model,
  models,
  InferSchemaType,
  Types,
  Model,
} from "mongoose";

/**
 * `pending` accounts were self-registered and are waiting for a teacher to
 * approve them on the people page. They cannot sign in, which is the only
 * gate: with no session there is nothing else in the app to protect. Accounts
 * from before this field existed have no value stored and read as `active`
 * through the schema default.
 */
export const USER_STATUSES = ["pending", "active"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface RequiredUserInfo {
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  ltiId?: string;
  status?: UserStatus;
}

export enum OptionalUserInfoKeys {
  background = "background",
  careerGoals = "careerGoals",
  interests = "interests",
  favoriteArtists = "favoriteArtists",
  avatarUrl = "avatarUrl",
}

// Use mapped type to create OptionalUserInfo interface
export type OptionalUserInfo = {
  [key in OptionalUserInfoKeys]?: string;
};

export type UserInfo = RequiredUserInfo & OptionalUserInfo;

interface UserMethods {
  updateUserInfo: (
    this: UserDocument,
    updatedFields: OptionalUserInfo
  ) => Promise<void>;
}

const userSchema = new Schema(
  {
    name: { type: Schema.Types.String, required: true },
    email: { type: Schema.Types.String, required: true, unique: true },
    // `select: false`: the hash is never included in query results unless a
    // caller explicitly opts in with `.select("+password")` (only the
    // credentials `authorize` path does). Defense in depth so no list/lookup
    // query can accidentally serialize password hashes.
    password: { type: Schema.Types.String, required: true, select: false },
    background: { type: Schema.Types.String, required: false },
    careerGoals: { type: Schema.Types.String, required: false },
    interests: { type: Schema.Types.String, required: false },
    favoriteArtists: { type: Schema.Types.String, required: false },
    role: { type: Schema.Types.String, required: true },
    avatarUrl: { type: Schema.Types.String, required: false },
    ltiId: { type: Schema.Types.String, required: false, index: true },
    status: {
      type: Schema.Types.String,
      required: true,
      enum: USER_STATUSES,
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.method(
  "updateUserInfo",
  async function (this: UserDocument, updatedFields: Partial<UserType>) {
    Object.assign(this, updatedFields);

    await this.save();
  }
);

export type UserType = InferSchemaType<typeof userSchema> & {
  isLoggedIn?: boolean;
  _id: Types.ObjectId;
};
export type UserWithIdType = UserType & { id: Types.ObjectId };
export type UserDocument = UserType & Document & UserMethods;
type UserModel = Model<UserInfo, {}, UserMethods>;

export const User =
  models?.User || model<UserDocument, UserModel>("User", userSchema);
