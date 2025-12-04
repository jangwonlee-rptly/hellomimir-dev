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
    <div className="flex rounded-lg bg-gray-100 p-1">
      {levels.map((level) => (
        <button
          key={level}
          onClick={() => onLevelChange(level)}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedLevel === level
              ? "bg-white text-primary-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {LEVEL_LABELS[level]}
        </button>
      ))}
    </div>
  );
}
