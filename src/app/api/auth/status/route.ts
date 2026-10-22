import { NextResponse } from "next/server";
import { isPasswordConfigured } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({
    passwordConfigured: isPasswordConfigured(),
    sessionSecretConfigured: Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16),
    mongoConfigured: Boolean(process.env.MONGODB_URI),
  });
}
