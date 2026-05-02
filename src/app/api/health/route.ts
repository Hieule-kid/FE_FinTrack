import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "FinTrack FE API proxy is up",
  });
}
