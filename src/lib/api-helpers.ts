import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "./db";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isValidId(id: string | undefined): id is string {
  return Boolean(id) && mongoose.Types.ObjectId.isValid(id!);
}

/** Wrap a route handler: connects to Mongo and turns thrown errors into JSON responses. */
export function withDB<Ctx>(
  handler: (req: Request, ctx: Ctx) => Promise<Response>
): (req: Request, ctx: Ctx) => Promise<Response> {
  return async (req, ctx) => {
    try {
      await connectDB();
      return await handler(req, ctx);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      console.error("[api]", message);
      return fail(message, 500);
    }
  };
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

export type Params<T extends Record<string, string>> = { params: Promise<T> };
