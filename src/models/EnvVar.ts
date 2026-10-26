import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const EnvVarSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    environment: { type: String, required: true, default: "development", index: true },
    key: { type: String, required: true, trim: true },
    value: { type: String, default: "" }, // encrypted at rest
    note: { type: String, default: "" },
    secret: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export type EnvVarDoc = InferSchemaType<typeof EnvVarSchema> & { _id: mongoose.Types.ObjectId };

export const EnvVar: Model<EnvVarDoc> = (mongoose.models.EnvVar as Model<EnvVarDoc>) || mongoose.model<EnvVarDoc>("EnvVar", EnvVarSchema);
