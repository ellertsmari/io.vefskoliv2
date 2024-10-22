import { z } from "zod";
import { Vote } from "../models/review";

export const SignupFormSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters long." })
    .trim(),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters long." })
    .trim(),
  email: z.string().email({ message: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { message: "Your password must be at least 8 characters long" })
    .trim(),
});

export type SignupFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const ReturnFormSchema = z.object({
  projectUrl: z.string().min(2, { message: "Please enter a valid URL" }).trim(),
  liveVersion: z
    .string()
    .min(2, { message: "Please enter a valid URL" })
    .trim(),
  projectName: z
    .string()
    .min(2, { message: "Please enter a valid project name" })
    .trim(),
  comment: z
    .string()
    .min(2, { message: "Please enter a valid description" })
    .trim(),
  guideId: z.string().trim(),
  imageOfProject: z.string().trim(),
});

export type ReturnFormState =
  | {
      errors?: {
        projectUrl?: string[];
        liveVersion?: string[];
        projectName?: string[];
        comment?: string[];
      };
      message?: string;
    }
  | undefined;

export const FeedbackFormSchema = z.object({
  vote: z.nativeEnum(Vote).refine((val) => Object.values(Vote).includes(val), {
    message: "Vote type is invalid",
  }),
  returnId: z.string().min(2, { message: "Please append a returnId" }).trim(),
  guideId: z.string().min(2, { message: "Please append a guideId" }).trim(),
  comment: z
    .string()
    .min(2, { message: "Please provide valid feedback" })
    .trim(),
});

export type FeedbackFormState =
  | {
      errors?: {
        returnId?: string[];
        vote?: string[];
        comment?: string[];
        guideId?: string[];
      };
      message?: string;
    }
  | undefined;

export const GradeFormSchema = z.object({
  grade: z
    .number()
    .int()
    .min(0, { message: "Grade must be at least 0" })
    .max(10, { message: "Grade must be at most 10" }),
  reviewId: z.string().min(2, { message: "Please append a reviewId" }).trim(),
});

export type GradeFormState =
  | {
      errors?: {
        reviewId?: string[];
        grade?: string[];
      };
      message?: string;
    }
  | undefined;
