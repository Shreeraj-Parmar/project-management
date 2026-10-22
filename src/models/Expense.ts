import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ExpenseSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: "USD" },
    category: { type: String, default: "Other" },
    date: { type: Date, default: () => new Date() },
    recurring: { type: String, enum: ["none", "monthly", "yearly"], default: "none" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export type ExpenseDoc = InferSchemaType<typeof ExpenseSchema> & { _id: mongoose.Types.ObjectId };

export const Expense: Model<ExpenseDoc> = (mongoose.models.Expense as Model<ExpenseDoc>) || mongoose.model<ExpenseDoc>("Expense", ExpenseSchema);
