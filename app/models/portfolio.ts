
import "models/autoConnect";
import { Schema, model, models } from "mongoose";


const profileSchema = new Schema(
  {
    name: {
      type: Schema.Types.String,
      required: true,
    },

    headline: {
      type: Schema.Types.String,
      required: true,
    },

    tagline: {
      type: Schema.Types.String,
      required: true,
    },

    about: {
      type: Schema.Types.String,
      required: true,
    },

    photoUrl: {
      type: Schema.Types.String,
      default: null,
    },

    location: {
      type: Schema.Types.String,
      required: true,
    },

    skills: {
      type: [Schema.Types.String],
      default: [],
    },

    languages: {
      type: [Schema.Types.String],
      default: [],
    },
  },
  { _id: false }
);


const availabilitySchema = new Schema(
  {
    openToInternships: {
      type: Schema.Types.Boolean,
      required: true,
      default: false,
    },

    availableFrom: {
      type: Schema.Types.Date,
      required: true,
    },

    lookingFor: {
      type: Schema.Types.String,
      required: true,
    },
  },
  { _id: false }
);


const projectSchema = new Schema(
  {
    id: {
      type: Schema.Types.String,
      required: true,
    },

    title: {
      type: Schema.Types.String,
      required: true,
    },

    description: {
      type: Schema.Types.String,
      required: true,
    },

    imageUrl: {
      type: Schema.Types.String,
      default: null,
    },

    technologies: {
      type: [Schema.Types.String],
      default: [],
    },

    liveUrl: {
      type: Schema.Types.String,
      required: false,
    },

    githubUrl: {
      type: Schema.Types.String,
      required: false,
    },
  },
  { _id: false }
);


const contactSchema = new Schema(
  {
    email: {
      type: Schema.Types.String,
      required: false,
    },

    linkedinUrl: {
      type: Schema.Types.String,
      required: false,
    },

    githubUrl: {
      type: Schema.Types.String,
      required: false,
    },

    cvUrl: {
      type: Schema.Types.String,
      required: false,
    },
  },
  { _id: false }
);

// Combine all portfolio content sections
const contentSchema = new Schema(
  {
    profile: {
      type: profileSchema,
      required: true,
    },

    availability: {
      type: availabilitySchema,
      required: true,
    },

    projects: {
      type: [projectSchema],
      default: [],
    },

    contact: {
      type: contactSchema,
      required: true,
    },

    theme: {
      type: Schema.Types.String,
      enum: ["editorial", "minimal", "studio"],
      required: true,
      default: "editorial",
    },
  },
  { _id: false }
);


const portfolioSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    slug: {
      type: Schema.Types.String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    visibility: {
      type: Schema.Types.String,
      enum: ["public", "hidden"],
      required: true,
      default: "hidden",
    },

    publishedAt: {
      type: Schema.Types.Date,
      required: true,
    },

    content: {
      type: contentSchema,
      required: true,
    },
  },
  {
    collection: "portfolios",

    timestamps: {
      createdAt: false,
      updatedAt: true,
    },
  }
);


export const Portfolio =
  models.Portfolio ||
  model("Portfolio", portfolioSchema);