import { authCookies } from "@/config/cookies";
import { env } from "@/config/env";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function buildPlanningUrl(
  request: NextRequest,
  pathSegments: string[],
): string {
  const baseUrl = env.planningServiceBaseUrl.replace(/\/$/, "");
  const joinedPath = pathSegments.join("/");
  const search = request.nextUrl.search;
  return `${baseUrl}/${joinedPath}${search}`;
}

function copyRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");
  headers.delete("content-length");
  return headers;
}

async function proxyPlanningRequest(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  if (!env.planningServiceBaseUrl) {
    return NextResponse.json(
      { message: "Missing PLANNING_SERVICE_BASE_URL configuration" },
      { status: 500 },
    );
  }

  const accessToken = request.cookies.get(authCookies.accessToken)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const headers = copyRequestHeaders(request);
  headers.set("Authorization", `Bearer ${accessToken}`);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let body: string | undefined;
  if (hasBody) {
    body = await request.text();
  }

  let response: Response;
  try {
    response = await fetch(buildPlanningUrl(request, pathSegments), {
      method: request.method,
      headers,
      ...(body !== undefined ? { body } : {}),
    });
  } catch (err) {
    console.error("[planning proxy] fetch failed:", err);
    return NextResponse.json(
      { message: "Cannot reach planning service" },
      { status: 502 },
    );
  }

  if (!response.ok) {
    console.error(
      "[planning proxy] upstream error",
      response.status,
      buildPlanningUrl(request, pathSegments),
    );
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

type PlanningRouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: PlanningRouteContext) {
  const { path } = await context.params;
  return proxyPlanningRequest(request, path);
}

export async function POST(
  request: NextRequest,
  context: PlanningRouteContext,
) {
  const { path } = await context.params;
  return proxyPlanningRequest(request, path);
}

export async function PUT(request: NextRequest, context: PlanningRouteContext) {
  const { path } = await context.params;
  return proxyPlanningRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: PlanningRouteContext,
) {
  const { path } = await context.params;
  return proxyPlanningRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: PlanningRouteContext,
) {
  const { path } = await context.params;
  return proxyPlanningRequest(request, path);
}
