import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** A folder in the Files module. `path` is the full path ("design/logos"), `name` its last segment. */
const FolderSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    name: { type: String, required: true },
    path: { type: String, required: true },
  },
  { timestamps: true }
);
FolderSchema.index({ projectId: 1, path: 1 }, { unique: true });

export type FolderDoc = InferSchemaType<typeof FolderSchema> & { _id: mongoose.Types.ObjectId };

export const Folder: Model<FolderDoc> = (mongoose.models.Folder as Model<FolderDoc>) || mongoose.model<FolderDoc>("Folder", FolderSchema);
