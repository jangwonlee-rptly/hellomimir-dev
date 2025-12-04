import { NextRequest, NextResponse } from "next/server";
import {
  getFieldBySlug,
  getDailyPaper,
  getPaperById,
  getPaperSummaries,
  getPaperQuiz,
} from "@/lib/supabaseClient";
import { getTodayDate } from "@/lib/dailyPaperService";
import type { DailyPaperWithDetails } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get the field
    const field = await getFieldBySlug(slug);
    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    // Get date from query params or use today
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || getTodayDate();

    // Get daily paper
    const dailyPaper = await getDailyPaper(field.id, date);
    if (!dailyPaper) {
      return NextResponse.json(
        { error: "No paper available for this date", date, field: field.slug },
        { status: 404 }
      );
    }

    // Get paper details
    const paper = await getPaperById(dailyPaper.paper_id);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Get summaries and quiz
    const summaries = await getPaperSummaries(paper.id, field.id);
    const quiz = await getPaperQuiz(paper.id, field.id);

    const response: DailyPaperWithDetails = {
      date,
      field,
      paper,
      summaries,
      quiz,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching today's paper:", error);
    return NextResponse.json(
      { error: "Failed to fetch today's paper" },
      { status: 500 }
    );
  }
}
