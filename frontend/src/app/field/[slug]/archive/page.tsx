import { notFound } from "next/navigation";
import Link from "next/link";
import { getFieldBySlug, getFieldArchive } from "@/lib/supabaseClient";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

interface ArchivePageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncateTitle(title: string, maxLength: number = 80): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength).trim() + "...";
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { slug } = await params;

  // Get field
  const field = await getFieldBySlug(slug);
  if (!field) {
    notFound();
  }

  // Get archive entries
  const archive = await getFieldArchive(field.id);

  return (
    <>
      <Header showBackLink backHref={`/field/${slug}`} backLabel="Today" />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{field.name}</h1>
          <p className="text-gray-600 mt-1">Paper Archive</p>
        </div>

        {archive.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No papers in the archive yet.</p>
            <Link
              href={`/field/${slug}`}
              className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              View today&apos;s paper
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {archive.map((entry) => (
              <Link
                key={entry.date}
                href={`/field/${slug}?date=${entry.date}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-sm font-medium text-primary-600 whitespace-nowrap">
                    {formatDate(entry.date)}
                  </span>
                  <span className="text-gray-900">
                    {truncateTitle(entry.paper.title)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
