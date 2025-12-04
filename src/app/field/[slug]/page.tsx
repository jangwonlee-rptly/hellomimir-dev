import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getFieldBySlug,
  getDailyPaper,
  getPaperById,
  getPaperSummaries,
  getPaperQuiz,
} from "@/lib/supabaseClient";
import { getTodayDate } from "@/lib/dailyPaperService";
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
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              No Paper Available
            </h1>
            <p className="text-gray-600 mb-6">
              There is no paper available for {field.name} on this date. The
              daily paper may not have been generated yet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/fields"
                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Browse other fields
              </Link>
              <Link
                href={`/field/${slug}/archive`}
                className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                View archive
              </Link>
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
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-600">Error: Paper data not found.</p>
          </div>
        </main>
      </>
    );
  }

  // Get summaries and quiz
  const summaries = await getPaperSummaries(paper.id, field.id);
  const quiz = await getPaperQuiz(paper.id, field.id);

  const data: DailyPaperWithDetails = {
    date,
    field,
    paper,
    summaries,
    quiz,
  };

  return (
    <>
      <Header showBackLink backHref="/fields" backLabel="Fields" />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <PaperView data={data} />

        {/* Link to archive */}
        <div className="mt-8 text-center">
          <Link
            href={`/field/${slug}/archive`}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            See previous papers
          </Link>
        </div>
      </main>
    </>
  );
}
