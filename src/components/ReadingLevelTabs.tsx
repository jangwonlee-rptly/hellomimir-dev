"use client";

import type { ReadingLevel } from "@/types";

interface ReadingLevelTabsProps {
  selectedLevel: ReadingLevel;
  onLevelChange: (level: ReadingLevel) => void;
}

const LEVEL_LABELS: Record<ReadingLevel, string> = {
  grade5: "Grade 5",
  middle: "Middle School",
  high: "High School",
};

export default function ReadingLevelTabs({
  selectedLevel,
  onLevelChange,
}: ReadingLevelTabsProps) {
  const levels: ReadingLevel[] = ["grade5", "middle", "high"];

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      {levels.map((level) => (
        <button
          key={level}
          onClick={() => onLevelChange(level)}
          className={`flex-1 px-6 py-4 text-base font-bold rounded-2xl transition-all ${
            selectedLevel === level
              ? "bg-white text-primary-700 shadow-lg border-2 border-primary-300 scale-105"
              : "bg-white/50 text-neutral-600 hover:text-neutral-900 border-2 border-transparent hover:border-neutral-300 hover:shadow-md"
          }`}
        >
          {LEVEL_LABELS[level]}
        </button>
      ))}
    </div>
  );
}
