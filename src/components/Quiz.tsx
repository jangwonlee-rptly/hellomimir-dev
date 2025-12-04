"use client";

import { useState, useEffect } from "react";
import type { QuizData, QuizResult } from "@/types";

interface QuizProps {
  quiz: QuizData;
  fieldSlug: string;
  date: string;
  arxivId: string;
}

function getStorageKey(fieldSlug: string, date: string, arxivId: string) {
  return `quizResult:${fieldSlug}:${date}:${arxivId}`;
}

function getSavedResult(
  fieldSlug: string,
  date: string,
  arxivId: string
): QuizResult | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(getStorageKey(fieldSlug, date, arxivId));
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveResult(
  fieldSlug: string,
  date: string,
  arxivId: string,
  result: QuizResult
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(fieldSlug, date, arxivId),
      JSON.stringify(result)
    );
  } catch {
    // Ignore storage errors
  }
}

export default function Quiz({ quiz, fieldSlug, date, arxivId }: QuizProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(quiz.questions.length).fill(null)
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [previousResult, setPreviousResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    const saved = getSavedResult(fieldSlug, date, arxivId);
    if (saved) {
      setPreviousResult(saved);
    }
  }, [fieldSlug, date, arxivId]);

  const handleSelectAnswer = (questionIndex: number, answerIndex: number) => {
    if (isSubmitted) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const score = selectedAnswers.reduce((acc: number, answer, index) => {
      if (answer === quiz.questions[index].correct_index) {
        return acc + 1;
      }
      return acc;
    }, 0);

    const result: QuizResult = {
      score,
      totalQuestions: quiz.questions.length,
      timestamp: new Date().toISOString(),
      answers: selectedAnswers.filter((a): a is number => a !== null),
    };

    saveResult(fieldSlug, date, arxivId, result);
    setPreviousResult(result);
    setIsSubmitted(true);
  };

  const handleRetake = () => {
    setSelectedAnswers(new Array(quiz.questions.length).fill(null));
    setIsSubmitted(false);
    setCurrentQuestion(0);
  };

  const allAnswered = selectedAnswers.every((a) => a !== null);

  if (!isOpen) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Test Your Understanding
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              {quiz.questions.length} multiple choice questions
            </p>
            {previousResult && (
              <p className="text-primary-600 text-sm mt-2">
                Previous score: {previousResult.score}/
                {previousResult.totalQuestions}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            {previousResult ? "Retake Quiz" : "Take the Quiz"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Quiz header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quiz</h3>
          <p className="text-gray-600 text-sm">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Question navigation dots */}
      <div className="px-6 py-3 border-b border-gray-200 flex gap-2 overflow-x-auto">
        {quiz.questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestion(index)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors flex-shrink-0 ${
              currentQuestion === index
                ? "bg-primary-600 text-white"
                : selectedAnswers[index] !== null
                ? isSubmitted
                  ? selectedAnswers[index] ===
                    quiz.questions[index].correct_index
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-red-100 text-red-700 border border-red-300"
                  : "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Current question */}
      <div className="p-6">
        <p className="text-gray-900 font-medium mb-4">
          {quiz.questions[currentQuestion].question}
        </p>

        <div className="space-y-3">
          {quiz.questions[currentQuestion].options.map((option, optionIndex) => {
            const isSelected =
              selectedAnswers[currentQuestion] === optionIndex;
            const isCorrect =
              optionIndex ===
              quiz.questions[currentQuestion].correct_index;

            let optionClasses =
              "w-full text-left p-4 rounded-lg border-2 transition-colors ";

            if (isSubmitted) {
              if (isCorrect) {
                optionClasses += "border-green-500 bg-green-50 text-green-900";
              } else if (isSelected && !isCorrect) {
                optionClasses += "border-red-500 bg-red-50 text-red-900";
              } else {
                optionClasses += "border-gray-200 text-gray-500";
              }
            } else {
              if (isSelected) {
                optionClasses += "border-primary-500 bg-primary-50";
              } else {
                optionClasses +=
                  "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
              }
            }

            return (
              <button
                key={optionIndex}
                onClick={() =>
                  handleSelectAnswer(currentQuestion, optionIndex)
                }
                disabled={isSubmitted}
                className={optionClasses}
              >
                <span className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-sm">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span>{option}</span>
                </span>
              </button>
            );
          })}
        </div>

        {isSubmitted && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-900 text-sm">
              <strong>Explanation:</strong>{" "}
              {quiz.questions[currentQuestion].explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation and submit */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentQuestion((c) => Math.max(0, c - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentQuestion((c) =>
                Math.min(quiz.questions.length - 1, c + 1)
              )
            }
            disabled={currentQuestion === quiz.questions.length - 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        {isSubmitted ? (
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-gray-900">
              Score: {previousResult?.score}/{previousResult?.totalQuestions}
            </span>
            <button
              onClick={handleRetake}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Retake Quiz
            </button>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
