"use client";

import { useState } from "react";
import type { PaperPrereading } from "@/types";

interface PreReadingGuideProps {
  prereading: PaperPrereading;
}

function getDifficultyColor(level: string): string {
  const colors: Record<string, string> = {
    beginner: "bg-emerald-100 text-emerald-800 border-emerald-300",
    intermediate: "bg-amber-100 text-amber-800 border-amber-300",
    advanced: "bg-orange-100 text-orange-800 border-orange-300",
    expert: "bg-rose-100 text-rose-800 border-rose-300",
  };
  return colors[level] || "bg-neutral-100 text-neutral-800 border-neutral-300";
}

function getDifficultyIcon(level: string): string {
  const icons: Record<string, string> = {
    beginner: "M13 10V3L4 14h7v7l9-11h-7z",
    intermediate: "M13 10V3L4 14h7v7l9-11h-7z",
    advanced: "M13 10V3L4 14h7v7l9-11h-7z",
    expert: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
  };
  return icons[level] || "M13 10V3L4 14h7v7l9-11h-7z";
}

function getDifficultyLabel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function PreReadingGuide({ prereading }: PreReadingGuideProps) {
  const [expandedJargon, setExpandedJargon] = useState<number | null>(null);
  const [expandedPrereq, setExpandedPrereq] = useState<number | null>(null);

  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 rounded-3xl shadow-xl border-2 border-primary-200 overflow-hidden">
      {/* Header stripe */}
      <div className="h-2 bg-gradient-to-r from-primary-400 via-accent-400 to-primary-600" />

      <div className="p-6 sm:p-8">
        {/* Title and meta info */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pb-6 border-b-2 border-primary-100">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-600 text-white shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
              Before You Read
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm shadow-md ${getDifficultyColor(prereading.difficulty_level)}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d={getDifficultyIcon(prereading.difficulty_level)} />
              </svg>
              {getDifficultyLabel(prereading.difficulty_level)}
            </div>
            {prereading.estimated_read_time_minutes && (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 bg-white text-neutral-900 border-neutral-300 font-bold text-sm shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ~{prereading.estimated_read_time_minutes} min
              </div>
            )}
          </div>
        </div>

        {/* Key Concepts */}
        {prereading.key_concepts && prereading.key_concepts.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="font-display font-bold text-xl text-neutral-900">
                Key Concepts Covered
              </h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {prereading.key_concepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-800 border-2 border-accent-200 shadow-md hover:shadow-lg hover:border-accent-300 transition-all"
                >
                  <span className="w-1.5 h-1.5 bg-accent-500 rounded-full" />
                  {concept}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Key Terms (Jargon) */}
        {prereading.jargon_json && prereading.jargon_json.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="font-display font-bold text-xl text-neutral-900">
                Key Terms to Know
              </h3>
              <span className="ml-auto px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">
                {prereading.jargon_json.length} {prereading.jargon_json.length === 1 ? 'term' : 'terms'}
              </span>
            </div>
            <dl className="grid gap-4">
              {prereading.jargon_json.map((entry, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl border-2 shadow-md overflow-hidden transition-all ${
                    expandedJargon === idx
                      ? "border-primary-400 shadow-lg"
                      : "border-primary-200 hover:border-primary-300"
                  }`}
                >
                  <button
                    onClick={() => setExpandedJargon(expandedJargon === idx ? null : idx)}
                    className="w-full p-5 text-left flex items-start gap-4 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <dt className="font-display font-bold text-lg text-neutral-900 mb-1">
                        {entry.term}
                      </dt>
                      <dd className="text-neutral-700 text-sm leading-relaxed">
                        {entry.definition}
                      </dd>
                    </div>
                    {entry.example_usage && (
                      <svg
                        className={`flex-shrink-0 w-5 h-5 text-primary-600 transition-transform ${
                          expandedJargon === idx ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  {entry.example_usage && expandedJargon === idx && (
                    <div className="px-5 pb-5 pt-2 bg-primary-50 border-t-2 border-primary-100">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <div>
                          <span className="text-xs font-bold text-primary-700 uppercase tracking-wide">Example Usage</span>
                          <dd className="text-neutral-700 text-sm italic mt-1 leading-relaxed">
                            {entry.example_usage}
                          </dd>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Prerequisites */}
        {prereading.prerequisites_json &&
          prereading.prerequisites_json.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="font-display font-bold text-xl text-neutral-900">
                  What You Should Know
                </h3>
                <span className="ml-auto px-3 py-1 bg-accent-100 text-accent-700 text-xs font-bold rounded-full">
                  {prereading.prerequisites_json.length} {prereading.prerequisites_json.length === 1 ? 'prerequisite' : 'prerequisites'}
                </span>
              </div>
              <ul className="grid gap-4">
                {prereading.prerequisites_json.map((entry, idx) => (
                  <li
                    key={idx}
                    className={`bg-white rounded-2xl border-2 shadow-md overflow-hidden transition-all ${
                      expandedPrereq === idx
                        ? "border-accent-400 shadow-lg"
                        : "border-accent-200 hover:border-accent-300"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedPrereq(expandedPrereq === idx ? null : idx)}
                      className="w-full p-5 text-left flex items-start gap-4 hover:bg-accent-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-accent-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-lg text-neutral-900 mb-1">
                          {entry.concept}
                        </div>
                        <div className="text-neutral-700 text-sm leading-relaxed">
                          {entry.why_needed}
                        </div>
                      </div>
                      {entry.resources && entry.resources.length > 0 && (
                        <svg
                          className={`flex-shrink-0 w-5 h-5 text-accent-600 transition-transform ${
                            expandedPrereq === idx ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    {entry.resources && entry.resources.length > 0 && expandedPrereq === idx && (
                      <div className="px-5 pb-5 pt-2 bg-accent-50 border-t-2 border-accent-100">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <div className="flex-1">
                            <span className="text-xs font-bold text-accent-700 uppercase tracking-wide">Helpful Resources</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {entry.resources.map((resource, ridx) => (
                                <span
                                  key={ridx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-accent-200 text-accent-800 text-xs font-semibold rounded-lg hover:border-accent-400 hover:shadow-md transition-all"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                  {resource}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
      </div>
    </div>
  );
}
