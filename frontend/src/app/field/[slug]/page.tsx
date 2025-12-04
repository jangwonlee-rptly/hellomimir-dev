import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getFieldBySlug,
  getDailyPaper,
  getPaperById,
  getPaperSummaries,
  getPaperQuiz,
  getPrereading,
} from "@/lib/supabaseClient";
import { getTodayDate } from "@/lib/utils";
import Header from "@/components/Header";
import PaperView from "@/components/PaperView";
import type { DailyPaperWithDetails } from "@/types";

export const dynamic = "force-dynamic";

interface FieldPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function FieldPage({
  params,
  searchParams,
}: FieldPageProps) {
  const { slug } = await params;
  const { date: queryDate } = await searchParams;

  const date = queryDate || getTodayDate();

  // Get field
  const field = await getFieldBySlug(slug);
  if (!field) {
    notFound();
  }

  // Get daily paper
  const dailyPaper = await getDailyPaper(field.id, date);

  if (!dailyPaper) {
    // No paper available
    return (
      <>
        <Header showBackLink backHref="/fields" backLabel="Fields" />
        <main className="min-h-screen bg-neutral-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center py-12">
              <div className="inline-block p-8 bg-white rounded-3xl shadow-xl border-2 border-neutral-200 mb-8">
                <svg className="w-20 h-20 text-neutral-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h1 className="font-display font-black text-3xl sm:text-4xl text-neutral-900 mb-4">
                  No Paper Available
                </h1>
                <p className="text-neutral-600 text-lg mb-8 max-w-md mx-auto">
                  There is no paper available for {field.name} on this date. The
                  daily paper may not have been generated yet.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/fields"
                    className="group inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-primary-700 transition-all hover:scale-105 hover:shadow-xl"
                  >
                    Browse other fields
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href={`/field/${slug}/archive`}
                    className="inline-flex items-center justify-center gap-2 bg-neutral-100 text-neutral-900 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-neutral-200 transition-all"
                  >
                    View archive
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Get paper details
  const paper = await getPaperById(dailyPaper.paper_id);
  if (!paper) {
    return (
      <>
        <Header showBackLink backHref="/fields" backLabel="Fields" />
        <main className="min-h-screen bg-neutral-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 font-semibold">Error: Paper data not found.</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Get summaries, quiz, and prereading
  const summaries = await getPaperSummaries(paper.id, field.id);
  const quiz = await getPaperQuiz(paper.id, field.id);
  const prereading = await getPrereading(paper.id, field.id);

  const data: DailyPaperWithDetails = {
    date,
    field,
    paper,
    summaries,
    quiz,
    prereading,
  };

  return (
    <>
      <Header showBackLink backHref="/fields" backLabel="Fields" />
      <main className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <PaperView data={data} />

          {/* Link to archive */}
          <div className="mt-12 text-center">
            <Link
              href={`/field/${slug}/archive`}
              className="group inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-lg transition-colors"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              See previous papers
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
