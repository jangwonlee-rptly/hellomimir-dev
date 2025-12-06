"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface FavoriteButtonProps {
  paperId: string;
}

export function FavoriteButton({ paperId }: FavoriteButtonProps) {
  const { user, session } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function checkFavoriteStatus() {
      if (!user || !session) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/users/me/favorites/${paperId}/status`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIsFavorite(data.is_favorite);
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
      } finally {
        setLoading(false);
      }
    }

    checkFavoriteStatus();
  }, [user, session, paperId]);

  const toggleFavorite = async () => {
    if (!user || !session || updating) return;

    setUpdating(true);
    const waseFavorite = isFavorite;
    setIsFavorite(!isFavorite); // Optimistic update

    try {
      const method = waseFavorite ? "DELETE" : "POST";
      const response = await fetch(`/api/users/me/favorites/${paperId}`, {
        method,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        // Revert on error
        setIsFavorite(waseFavorite);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setIsFavorite(waseFavorite);
    } finally {
      setUpdating(false);
    }
  };

  // Don't show button if not logged in
  if (!user) return null;

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading || updating}
      className={`group p-2 rounded-xl transition-all ${
        loading
          ? "bg-neutral-100 cursor-wait"
          : isFavorite
            ? "bg-red-50 hover:bg-red-100"
            : "bg-neutral-100 hover:bg-red-50"
      }`}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        className={`w-6 h-6 transition-all ${
          loading
            ? "text-neutral-300"
            : isFavorite
              ? "text-red-500 fill-red-500"
              : "text-neutral-400 group-hover:text-red-400"
        } ${updating ? "animate-pulse" : ""}`}
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
