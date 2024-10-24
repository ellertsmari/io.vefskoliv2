"use server";

import {
  FeedbackFormSchema,
  FeedbackFormState,
  GradeFormSchema,
  GradeFormState,
  ReturnFormSchema,
  ReturnFormState,
  SignupFormSchema,
  SignupFormState,
} from "../utils/formvalidation";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import type { FeedbackType, GradedFeedbackDocument } from "../models/review";
import { signIn, signOut as s, getUser, auth } from "../../auth";
import { AuthError } from "next-auth";
import { OptionalUserInfo, User, UserDocument } from "../models/user";
import { FilterQuery, Types } from "mongoose";
import { GuideDocument } from "../models/guide";
import { connectToDatabase } from "./mongoose-connector";
import { Guide } from "../models/guide";
import { Return } from "../models/return";
import { Review, Vote } from "../models/review";

export const signOut = s; //needs to be in actions.ts so that it can be called on the client side
export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function returnGuide(state: ReturnFormState, formData: FormData) {
  const validatedFields = ReturnFormSchema.safeParse({
    projectUrl: formData.get("projectUrl"),
    liveVersion: formData.get("liveVersion"),
    projectName: formData.get("projectName"),
    comment: formData.get("comment"),
    guideId: formData.get("guideId"),
    imageOfProject: formData.get("imageOfProject"),
  });
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    projectUrl,
    projectName,
    comment,
    liveVersion,
    guideId,
    imageOfProject,
  } = validatedFields.data;

  const session = await auth();

  if (!session?.user) {
    return {
      success: false,
      message: "You must be logged in to submit a return",
    };
  }
  const { user } = session;
  try {
    const theReturn = await Return.create({
      projectUrl,
      projectName,
      comment,
      liveVersion,
      owner: user.id,
      guide: new ObjectId(guideId),
      imageOfProject: imageOfProject,
    });

    return {
      success: true,
      message: "Return submitted successfully",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to submit return",
    };
  }
}

export type FeedbackDataType = {
  vote: Vote | undefined;
  comment: string | undefined;
  returnId: string | undefined;
  guideId: string | undefined;
};

export async function returnFeedback(
  state: FeedbackFormState,
  data: FeedbackDataType
) {
  const validatedFields = FeedbackFormSchema.safeParse({
    vote: data.vote,
    comment: data.comment,
    returnId: data.returnId,
    guideId: data.guideId,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { vote, comment, returnId } = validatedFields.data;
  const session = await auth();

  if (!session?.user) {
    return {
      success: false,
      message: "You must be logged in to submit a return",
    };
  }
  const { user } = session;

  const reviewData: Omit<FeedbackType, "createdAt"> = {
    vote,
    comment,
    owner: new ObjectId(user.id),
    return: new ObjectId(returnId),
    guide: new ObjectId(data.guideId),
  };

  try {
    const review = await Review.create(reviewData);

    return {
      success: true,
      message: "Return feedback submitted successfully",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to submit return feedback",
    };
  }
}

export type GradeDataType = {
  grade: number | undefined;
  reviewId: string | undefined;
};

export async function returnGrade(state: GradeFormState, data: GradeDataType) {
  const validatedFields = GradeFormSchema.safeParse({
    grade: data.grade,
    reviewId: data.reviewId,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { grade, reviewId } = validatedFields.data;
  const session = await auth();

  if (!session?.user) {
    return {
      success: false,
      message: "You must be logged in to give a grade",
    };
  }

  try {
    await Review.updateOne({ _id: new ObjectId(reviewId) }, { grade });

    const gradedDocument: GradedFeedbackDocument = (await Review.findById(
      new ObjectId(reviewId)
    )) as GradedFeedbackDocument;

    if (!gradedDocument) {
      return {
        success: false,
        message: "Failed to submit grade",
      };
    }

    return {
      success: true,
      data: gradedDocument,
      message: "Grade submitted successfully",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to submit grade",
    };
  }
}

export async function signUp(state: SignupFormState, formData: FormData) {
  // Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  const {
    firstName,
    lastName,
    email,
    password: rawPassword,
  } = validatedFields.data;
  const password = await bcrypt.hash(rawPassword, 10);

  try {
    await User.create({
      name: firstName + " " + lastName,
      email,
      password,
      role: "user",
    });
  } catch (error) {
    return {
      success: false,
      message: "Failed to create user. May already exist.",
    };
  }

  try {
    const user = await getUser(email);
    await signIn("credentials", {
      email,
      password: rawPassword,
    });
  } catch (error) {}

  return {
    success: true,
    message:
      "Successfully registered. Now logging you in. If it fails you will be redirected to the login page.",
  };
}

// currently not secure and allows for any user to be updated
export async function updateUserInfo(email: string, info: OptionalUserInfo) {
  const response = await fetch("http://localhost:3000" + "/api/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, info }),
  });
  if (!response.ok) {
    throw new Error("Failed to update user info");
  }

  const data = await response.json();
  return data;
}

export const getGuide = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }
  const objectId = new Types.ObjectId(id);
  await connectToDatabase();
  const guide: GuideDocument | null = await Guide.findOne({
    _id: objectId,
  });
  return guide;
};

export const getUsers = async (filter: FilterQuery<any>) => {
  await connectToDatabase();
  const users = await User.find(filter);

  return JSON.parse(JSON.stringify(users)) as UserDocument[];
};
