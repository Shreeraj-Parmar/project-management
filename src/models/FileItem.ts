import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const FileItemSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    name: { type: String, required: true },
    key: { type: String, required: true }, // S3 object key
    size: { type: Number, default: 0 },
    contentType: { type: String, default: "application/octet-stream" },
    folder: { type: String, default: "" },
    status: { type: String, enum: ["pending", "uploaded"], default: "pending" },
  },
  { timestamps: true }
);

export type FileItemDoc = InferSchemaType<typeof FileItemSchema> & { _id: mongoose.Types.ObjectId };

export const FileItem: Model<FileItemDoc> = (mongoose.models.FileItem as Model<FileItemDoc>) || mongoose.model<FileItemDoc>("FileItem", FileItemSchema);
