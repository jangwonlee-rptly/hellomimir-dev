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
    <div className="space-y-6 sm:space-y-8">
      {/* Date header */}
      <div className="text-center pb-6 border-b-2 border-neutral-200">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-full text-sm font-semibold text-primary-700 mb-4">
          <span className="w-2 h-2 bg-primary-500 rounded-full" />
          {field.name}
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-neutral-900 mt-2">
          {isToday ? "Today's Paper" : `Paper for ${formatDate(date)}`}
        </h1>
        {isToday && (
          <p className="text-neutral-600 text-lg mt-2">{formatDate(date)}</p>
        )}
      </div>

      {/* Paper info - Magazine-style card */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-neutral-200 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary-400 to-accent-500" />
        <div className="p-6 sm:p-8">
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-neutral-900 leading-tight mb-4">
            {paper.title}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-neutral-600 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium">
                {formatAuthors(paper.authors_json)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">
                {new Date(paper.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`https://arxiv.org/abs/${paper.arxiv_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all hover:scale-105 hover:shadow-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View on arXiv
            </a>
            <a
              href={paper.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-neutral-100 text-neutral-900 rounded-xl font-semibold hover:bg-neutral-200 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Read Full PDF
            </a>
          </div>
        </div>
      </div>

      {/* Reading level selector */}
      <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-3xl shadow-lg border-2 border-primary-200 p-6 sm:p-8">
        <h3 className="font-display font-bold text-xl text-neutral-900 mb-4">
          Choose your reading level
        </h3>
        <ReadingLevelTabs
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
        />
      </div>

      {/* Summary - Editorial style */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-neutral-200 p-6 sm:p-8 lg:p-10">
        <h3 className="font-display font-black text-3xl sm:text-4xl text-neutral-900 mb-6 border-l-4 border-primary-600 pl-6">
          Summary
        </h3>
        <div className="prose prose-lg max-w-none">
          {summaries[selectedLevel] ? (
            summaries[selectedLevel].split("\n\n").map((paragraph, index) => (
              <p key={index} className="text-neutral-700 leading-relaxed mb-5 text-base sm:text-lg">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-neutral-500 italic text-lg">
              Summary not available for this reading level.
            </p>
          )}
        </div>
        <div className="mt-6 pt-6 border-t-2 border-neutral-100">
          <p className="text-xs text-neutral-400 flex items-start gap-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Generated summary - may contain errors. Always refer to the original paper for accurate information.</span>
          </p>
        </div>
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
