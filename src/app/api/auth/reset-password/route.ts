import { NextResponse } from "next/server";
import { authFacade } from "@/features/auth/server/auth.facade";

export const maxDuration = 60;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 },
    );
  }

  const backendResponse = await authFacade.resetPassword(payload);
  return NextResponse.json(backendResponse.data, {
    status: backendResponse.status,
  });
}
