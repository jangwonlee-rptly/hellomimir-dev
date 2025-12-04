import { NextRequest, NextResponse } from "next/server";
import {
  processAllFieldsForDate,
  getTodayDate,
} from "@/lib/dailyPaperService";

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

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get date from request body or use today
    let date = getTodayDate();

    try {
      const body = await request.json();
      if (body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
        date = body.date;
      }
    } catch {
      // No body or invalid JSON - use default date
    }

    console.log(`Starting daily paper processing for date: ${date}`);

    const result = await processAllFieldsForDate(date);

    const successCount = result.results.filter((r) => r.success).length;
    const failCount = result.results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Processed ${result.results.length} fields`,
      date,
      successCount,
      failCount,
      results: result.results,
    });
  } catch (error) {
    console.error("Error in daily paper cron job:", error);
    return NextResponse.json(
      {
        error: "Failed to process daily papers",
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
    const date = searchParams.get("date") || getTodayDate();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    console.log(`Starting daily paper processing for date: ${date}`);

    const result = await processAllFieldsForDate(date);

    const successCount = result.results.filter((r) => r.success).length;
    const failCount = result.results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Processed ${result.results.length} fields`,
      date,
      successCount,
      failCount,
      results: result.results,
    });
  } catch (error) {
    console.error("Error in daily paper cron job:", error);
    return NextResponse.json(
      {
        error: "Failed to process daily papers",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
