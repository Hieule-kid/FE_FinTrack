import { NextResponse } from "next/server";
import { authFacade } from "@/features/auth/server/auth.facade";

export async function POST(request: Request) {
  const payload = await request.json();

  const backendResponse = await authFacade.register(payload);
  return NextResponse.json(backendResponse.data, {
    status: backendResponse.status,
  });
}
