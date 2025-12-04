"use client";

import { useState } from "react";
import type { DailyPaperWithDetails, ReadingLevel } from "@/types";
import ReadingLevelTabs from "./ReadingLevelTabs";
import Quiz from "./Quiz";

interface PaperViewProps {
  data: DailyPaperWithDetails;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAuthors(authors: string[]): string {
  if (authors.length === 0) return "Unknown";
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return authors.join(" and ");
  if (authors.length <= 3) return authors.join(", ");
  return `${authors.slice(0, 3).join(", ")} et al.`;
}

export default function PaperView({ data }: PaperViewProps) {
  const [selectedLevel, setSelectedLevel] = useState<ReadingLevel>("middle");

  const { paper, summaries, quiz, date, field } = data;
  const isToday =
    date === new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Date header */}
      <div className="text-center pb-4 border-b border-gray-200">
        <p className="text-sm text-primary-600 font-medium">{field.name}</p>
        <h1 className="text-xl font-bold text-gray-900 mt-1">
          {isToday ? "Today's Paper" : `Paper for ${formatDate(date)}`}
        </h1>
        {isToday && (
          <p className="text-gray-500 text-sm mt-1">{formatDate(date)}</p>
        )}
      </div>

      {/* Paper info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 leading-tight">
          {paper.title}
        </h2>
        <p className="text-gray-600 mt-2 text-sm">
          {formatAuthors(paper.authors_json)}
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Published:{" "}
          {new Date(paper.published_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div className="flex flex-wrap gap-3 mt-4">
          <a
            href={`https://arxiv.org/abs/${paper.arxiv_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            View on arXiv
          </a>
          <a
            href={paper.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Read Full PDF
          </a>
        </div>
      </div>

      {/* Reading level selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Choose your reading level:
        </h3>
        <ReadingLevelTabs
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
        />
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="prose prose-gray max-w-none">
          {summaries[selectedLevel] ? (
            summaries[selectedLevel].split("\n\n").map((paragraph, index) => (
              <p key={index} className="text-gray-700 leading-relaxed mb-4">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-gray-500 italic">
              Summary not available for this reading level.
            </p>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
          Generated summary - may contain errors. Always refer to the original
          paper for accurate information.
        </p>
      </div>

      {/* Quiz */}
      {quiz && (
        <Quiz
          quiz={quiz}
          fieldSlug={field.slug}
          date={date}
          arxivId={paper.arxiv_id}
        />
      )}
    </div>
  );
}
