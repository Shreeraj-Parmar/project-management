import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ColumnSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    color: { type: String, default: "blue" },
  },
  { _id: false }
);

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    color: { type: String, default: "ocean" },
    status: { type: String, enum: ["active", "paused", "completed", "archived"], default: "active" },
    tags: { type: [String], default: [] },
    starred: { type: Boolean, default: false },
    links: {
      type: [{ label: String, url: String }],
      default: [],
    },
    columns: {
      type: [ColumnSchema],
      default: () => [
        { id: "todo", title: "To Do", color: "blue" },
        { id: "doing", title: "In Progress", color: "yellow" },
        { id: "review", title: "Review", color: "purple" },
        { id: "done", title: "Done", color: "green" },
      ],
    },
    git: {
      repo: { type: String, default: "" }, // owner/name
      token: { type: String, default: "" }, // encrypted, optional per-project override
    },
  },
  { timestamps: true }
);

export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & { _id: mongoose.Types.ObjectId };

export const Project: Model<ProjectDoc> = (mongoose.models.Project as Model<ProjectDoc>) || mongoose.model<ProjectDoc>("Project", ProjectSchema);
