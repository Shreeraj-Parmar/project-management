import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ChecklistItemSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const TaskSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    columnId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    labels: { type: [String], default: [] }, // label color ids
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    dueDate: { type: Date, default: null },
    order: { type: Number, default: 0 },
    checklist: { type: [ChecklistItemSchema], default: [] },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type TaskDoc = InferSchemaType<typeof TaskSchema> & { _id: mongoose.Types.ObjectId };

export const Task: Model<TaskDoc> = (mongoose.models.Task as Model<TaskDoc>) || mongoose.model<TaskDoc>("Task", TaskSchema);
