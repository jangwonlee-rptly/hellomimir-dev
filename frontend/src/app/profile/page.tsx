"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { getFields } from "@/lib/supabaseClient";
import type {
  Field,
  QuizScoreWithDetails,
  FavoritePaperWithDetails,
} from "@/types";

export default function ProfilePage() {
  const { user, session, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [fields, setFields] = useState<Field[]>([]);
  const [quizScores, setQuizScores] = useState<QuizScoreWithDetails[]>([]);
  const [favorites, setFavorites] = useState<FavoritePaperWithDetails[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/profile");
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function fetchData() {
      if (!session) return;

      try {
        // Fetch fields for preference selection
        const fieldsData = await getFields();
        setFields(fieldsData);

        // Fetch quiz scores
        const scoresResponse = await fetch("/api/users/me/quiz-scores", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (scoresResponse.ok) {
          setQuizScores(await scoresResponse.json());
        }

        // Fetch favorites
        const favoritesResponse = await fetch("/api/users/me/favorites", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (favoritesResponse.ok) {
          setFavorites(await favoritesResponse.json());
        }

        if (profile?.preferred_field_id) {
          setSelectedFieldId(profile.preferred_field_id);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoadingData(false);
      }
    }

    if (session) {
      fetchData();
    }
  }, [session, profile]);

  const handleUpdatePreference = async () => {
    if (!session || updating) return;

    setUpdating(true);
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          preferred_field_id: selectedFieldId,
        }),
      });

      if (response.ok) {
        await refreshProfile();
      }
    } catch (error) {
      console.error("Error updating preference:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-neutral-500">Loading...</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl border-2 border-neutral-200 shadow-lg p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Profile"
                width={80}
                height={80}
                className="w-20 h-20 rounded-full border-4 border-primary-200"
                unoptimized
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-100 border-4 border-primary-200 flex items-center justify-center text-primary-700 font-bold text-2xl">
                {profile?.display_name?.[0]?.toUpperCase() ||
                  user.email?.[0]?.toUpperCase() ||
                  "U"}
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-2xl text-neutral-900">
                {profile?.display_name || "User"}
              </h1>
              <p className="text-neutral-600">{user.email}</p>
            </div>
          </div>

          {/* Preferred Field Selection */}
          <div className="border-t border-neutral-200 pt-6">
            <h2 className="font-semibold text-neutral-900 mb-3">
              Preferred Field
            </h2>
            <p className="text-sm text-neutral-600 mb-4">
              Choose your favorite field to see it first on the homepage
            </p>
            <div className="flex flex-wrap gap-2">
              {fields.map((field) => (
                <button
                  key={field.id}
                  onClick={() => setSelectedFieldId(field.id)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    selectedFieldId === field.id
                      ? "bg-primary-600 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {field.name}
                </button>
              ))}
            </div>
            {selectedFieldId !== profile?.preferred_field_id && (
              <button
                onClick={handleUpdatePreference}
                disabled={updating}
                className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save Preference"}
              </button>
            )}
          </div>
        </div>

        {/* Favorites Section */}
        <section id="favorites" className="mb-8">
          <h2 className="font-display font-bold text-xl text-neutral-900 mb-4 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Favorite Papers
          </h2>
          {loadingData ? (
            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6 animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6 text-center text-neutral-500">
              <p>No favorite papers yet.</p>
              <p className="text-sm mt-1">
                Click the heart icon on any paper to save it here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((fav) => (
                <Link
                  key={fav.id}
                  href={`https://arxiv.org/abs/${fav.paper_arxiv_id}`}
                  target="_blank"
                  className="block bg-white rounded-2xl border-2 border-neutral-200 p-4 hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    {fav.paper_title}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    arXiv: {fav.paper_arxiv_id}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quiz History Section */}
        <section id="quizzes">
          <h2 className="font-display font-bold text-xl text-neutral-900 mb-4 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Quiz History
          </h2>
          {loadingData ? (
            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6 animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
            </div>
          ) : quizScores.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6 text-center text-neutral-500">
              <p>No quiz attempts yet.</p>
              <p className="text-sm mt-1">
                Take a quiz on any paper to see your scores here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizScores.map((score) => (
                <div
                  key={score.id}
                  className="bg-white rounded-2xl border-2 border-neutral-200 p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {score.paper_title}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {score.field_name} &bull;{" "}
                      {new Date(score.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-2xl font-bold ${
                        score.score / score.total_questions >= 0.7
                          ? "text-green-600"
                          : score.score / score.total_questions >= 0.5
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {score.score}/{score.total_questions}
                    </span>
                    <p className="text-xs text-neutral-500">
                      {Math.round((score.score / score.total_questions) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
