"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { QuizData, UserQuizScore } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface QuizProps {
  quiz: QuizData;
  fieldSlug: string;
  date: string;
  arxivId: string;
  paperId: string;
  fieldId: string;
}

export default function Quiz({
  quiz,
  fieldSlug,
  date,
  paperId,
  fieldId,
}: QuizProps) {
  const { user, session } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(quiz.questions.length).fill(null)
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [previousResult, setPreviousResult] = useState<UserQuizScore | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadingScore, setLoadingScore] = useState(true);

  // Fetch existing score from backend
  useEffect(() => {
    async function fetchExistingScore() {
      if (!user || !session) {
        setLoadingScore(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/users/me/quiz-scores/${paperId}/${fieldId}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const score = await response.json();
          setPreviousResult(score);
        }
      } catch (error) {
        console.error("Error fetching quiz score:", error);
      } finally {
        setLoadingScore(false);
      }
    }

    fetchExistingScore();
  }, [user, session, paperId, fieldId]);

  const handleSelectAnswer = (questionIndex: number, answerIndex: number) => {
    if (isSubmitted) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!user || !session) {
      router.push(`/login?redirect=/field/${fieldSlug}?date=${date}`);
      return;
    }

    const score = selectedAnswers.reduce((acc: number, answer, index) => {
      if (answer === quiz.questions[index].correct_index) {
        return acc + 1;
      }
      return acc;
    }, 0);

    setIsLoading(true);

    try {
      const response = await fetch("/api/users/me/quiz-scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          paper_id: paperId,
          field_id: fieldId,
          score,
          total_questions: quiz.questions.length,
          answers: selectedAnswers.filter((a): a is number => a !== null),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPreviousResult(result);
      }
    } catch (error) {
      console.error("Error submitting quiz score:", error);
    } finally {
      setIsLoading(false);
      setIsSubmitted(true);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers(new Array(quiz.questions.length).fill(null));
    setIsSubmitted(false);
    setCurrentQuestion(0);
  };

  const handleStartQuiz = () => {
    if (!user) {
      router.push(`/login?redirect=/field/${fieldSlug}?date=${date}`);
      return;
    }
    setIsOpen(true);
  };

  const allAnswered = selectedAnswers.every((a) => a !== null);

  // Show login prompt if not authenticated
  if (!isOpen) {
    return (
      <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-3xl shadow-lg border-2 border-accent-200 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-accent-400 to-primary-500" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-neutral-900 mb-2">
                Test Your Understanding
              </h3>
              <p className="text-neutral-600 text-base">
                {quiz.questions.length} multiple choice questions
              </p>
              {loadingScore ? (
                <div className="mt-3 h-8 w-40 bg-neutral-200 animate-pulse rounded-full" />
              ) : previousResult ? (
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-primary-100 border border-primary-300 rounded-full">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-primary-700 font-semibold text-sm">
                    Best score: {previousResult.score}/
                    {previousResult.total_questions}
                  </span>
                </div>
              ) : !user ? (
                <p className="text-sm text-neutral-500 mt-3">
                  Sign in to take the quiz and track your progress
                </p>
              ) : null}
            </div>
            {user ? (
              <button
                onClick={handleStartQuiz}
                className="group inline-flex items-center justify-center gap-3 bg-primary-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-primary-700 transition-all hover:scale-105 hover:shadow-xl"
              >
                {previousResult ? "Retake Quiz" : "Take the Quiz"}
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            ) : (
              <Link
                href={`/login?redirect=/field/${fieldSlug}?date=${date}`}
                className="group inline-flex items-center justify-center gap-3 bg-primary-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-primary-700 transition-all hover:scale-105 hover:shadow-xl"
              >
                Sign in to Quiz
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-neutral-200 shadow-xl overflow-hidden">
      {/* Quiz header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-6 py-5 flex items-center justify-between">
        <div>
          <h3 className="font-display font-black text-2xl text-white">
            Quiz Time!
          </h3>
          <p className="text-primary-50 text-sm font-medium">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-primary-100 transition-colors p-2 hover:bg-white/20 rounded-xl"
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
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Question navigation dots */}
      <div className="px-6 py-4 border-b-2 border-neutral-100 flex gap-2 overflow-x-auto bg-neutral-50">
        {quiz.questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestion(index)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 ${
              currentQuestion === index
                ? "bg-primary-600 text-white shadow-lg scale-110"
                : selectedAnswers[index] !== null
                  ? isSubmitted
                    ? selectedAnswers[index] ===
                      quiz.questions[index].correct_index
                      ? "bg-green-500 text-white border-2 border-green-600"
                      : "bg-red-500 text-white border-2 border-red-600"
                    : "bg-primary-100 text-primary-700 border-2 border-primary-300"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 border-2 border-neutral-300"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Current question */}
      <div className="p-6 sm:p-8">
        <p className="font-display font-bold text-xl sm:text-2xl text-neutral-900 mb-6 leading-snug">
          {quiz.questions[currentQuestion].question}
        </p>

        <div className="space-y-3">
          {quiz.questions[currentQuestion].options.map((option, optionIndex) => {
            const isSelected = selectedAnswers[currentQuestion] === optionIndex;
            const isCorrect =
              optionIndex === quiz.questions[currentQuestion].correct_index;

            let optionClasses =
              "w-full text-left p-5 rounded-2xl border-2 transition-all font-medium ";

            if (isSubmitted) {
              if (isCorrect) {
                optionClasses +=
                  "border-green-500 bg-green-50 text-green-900 shadow-lg";
              } else if (isSelected && !isCorrect) {
                optionClasses +=
                  "border-red-500 bg-red-50 text-red-900 shadow-lg";
              } else {
                optionClasses +=
                  "border-neutral-200 text-neutral-500 opacity-60";
              }
            } else {
              if (isSelected) {
                optionClasses +=
                  "border-primary-500 bg-primary-50 text-primary-900 shadow-lg scale-[1.02]";
              } else {
                optionClasses +=
                  "border-neutral-300 hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-md";
              }
            }

            return (
              <button
                key={optionIndex}
                onClick={() => handleSelectAnswer(currentQuestion, optionIndex)}
                disabled={isSubmitted}
                className={optionClasses}
              >
                <span className="flex items-start gap-4">
                  <span
                    className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      isSubmitted && isCorrect
                        ? "bg-green-500 text-white border-green-600"
                        : isSubmitted && isSelected && !isCorrect
                          ? "bg-red-500 text-white border-red-600"
                          : isSelected
                            ? "bg-primary-600 text-white border-primary-700"
                            : "border-neutral-400"
                    }`}
                  >
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="flex-1 text-base">{option}</span>
                  {isSubmitted && isCorrect && (
                    <svg
                      className="w-6 h-6 text-green-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {isSubmitted && isSelected && !isCorrect && (
                    <svg
                      className="w-6 h-6 text-red-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {isSubmitted && (
          <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-bold text-blue-900 mb-1">Explanation</p>
                <p className="text-blue-800 text-sm leading-relaxed">
                  {quiz.questions[currentQuestion].explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation and submit */}
      <div className="px-6 py-5 border-t-2 border-neutral-100 bg-neutral-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentQuestion((c) => Math.max(0, c - 1))}
            disabled={currentQuestion === 0}
            className="group flex items-center gap-2 px-5 py-3 bg-white text-neutral-700 rounded-xl font-semibold hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-neutral-300 hover:border-neutral-400 transition-all"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentQuestion((c) =>
                Math.min(quiz.questions.length - 1, c + 1)
              )
            }
            disabled={currentQuestion === quiz.questions.length - 1}
            className="group flex items-center gap-2 px-5 py-3 bg-white text-neutral-700 rounded-xl font-semibold hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-neutral-300 hover:border-neutral-400 transition-all"
          >
            Next
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {isSubmitted ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-primary-100 to-accent-100 border-2 border-primary-300 rounded-2xl">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-display font-black text-xl text-neutral-900">
                Score: {previousResult?.score}/{previousResult?.total_questions}
              </span>
            </div>
            <button
              onClick={handleRetake}
              className="group inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all hover:scale-105 hover:shadow-lg"
            >
              Retake Quiz
              <svg
                className="w-5 h-5 group-hover:rotate-180 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || isLoading}
            className="group inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-xl"
          >
            {isLoading ? "Submitting..." : "Submit Quiz"}
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
