import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "demo-user",
    email: "demo@finplan.local",
    roles: ["user"],
  });
}
