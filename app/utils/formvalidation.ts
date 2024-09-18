import { z } from "zod";

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
