import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const NoteSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" }, // markdown
    color: { type: String, default: "#fff7d6" },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type NoteDoc = InferSchemaType<typeof NoteSchema> & { _id: mongoose.Types.ObjectId };

export const Note: Model<NoteDoc> = (mongoose.models.Note as Model<NoteDoc>) || mongoose.model<NoteDoc>("Note", NoteSchema);
