import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PasswordSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "Other" },
    username: { type: String, default: "" },
    password: { type: String, default: "" }, // encrypted at rest
    url: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export type PasswordDoc = InferSchemaType<typeof PasswordSchema> & { _id: mongoose.Types.ObjectId };

export const Password: Model<PasswordDoc> = (mongoose.models.Password as Model<PasswordDoc>) || mongoose.model<PasswordDoc>("Password", PasswordSchema);
