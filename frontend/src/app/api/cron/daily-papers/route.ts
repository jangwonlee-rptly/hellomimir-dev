/**
 * Next.js API Route that proxies to FastAPI backend
 *
 * This endpoint no longer runs ingestion locally. Instead, it forwards
 * the request to the FastAPI backend service.
 */
import { NextRequest, NextResponse } from "next/server";

// Verify cron secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.warn("CRON_SECRET not configured - allowing all requests");
    return true;
  }

  const providedSecret = request.headers.get("x-cron-secret");
  return providedSecret === cronSecret;
}

// Get backend API URL
function getBackendUrl(): string {
  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
  return `${backendUrl}/internal/papers/daily`;
}

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse body to forward to backend
    let body = {};
    try {
      body = await request.json();
    } catch {
      // No body
    }

    console.log(`Forwarding daily paper request to backend...`);

    // Forward request to FastAPI backend
    const backendUrl = getBackendUrl();
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cron-Secret": process.env.CRON_SECRET || "",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error forwarding to backend:", error);
    return NextResponse.json(
      {
        error: "Failed to communicate with backend service",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggering with query params
export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");

    console.log(`Forwarding daily paper request to backend (GET)...`);

    // Forward request to FastAPI backend
    const backendUrl = getBackendUrl();
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Cron-Secret": process.env.CRON_SECRET || "",
      },
      body: JSON.stringify(date ? { date } : {}),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error forwarding to backend:", error);
    return NextResponse.json(
      {
        error: "Failed to communicate with backend service",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
