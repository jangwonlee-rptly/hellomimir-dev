"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface PaperNotesProps {
  paperId: string;
}

export function PaperNotes({ paperId }: PaperNotesProps) {
  const { user, session } = useAuth();
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch existing note
  useEffect(() => {
    async function fetchNote() {
      if (!user || !session) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/me/notes/${paperId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setNote(data.note_text);
          setSavedNote(data.note_text);
          if (data.note_text) {
            setIsExpanded(true);
          }
        }
      } catch (error) {
        console.error("Error fetching note:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNote();
  }, [user, session, paperId]);

  // Debounced save
  const saveNote = useCallback(
    async (noteText: string) => {
      if (!user || !session) return;
      if (noteText === savedNote) return;

      setSaving(true);

      try {
        if (noteText.trim() === "") {
          // Delete empty notes
          await fetch(`/api/users/me/notes/${paperId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
        } else {
          await fetch(`/api/users/me/notes/${paperId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ note_text: noteText }),
          });
        }
        setSavedNote(noteText);
      } catch (error) {
        console.error("Error saving note:", error);
      } finally {
        setSaving(false);
      }
    },
    [user, session, paperId, savedNote]
  );

  // Auto-save with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (note !== savedNote) {
        saveNote(note);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [note, savedNote, saveNote]);

  // Don't show if not logged in
  if (!user) return null;

  const hasUnsavedChanges = note !== savedNote;

  return (
    <div className="bg-white rounded-3xl border-2 border-neutral-200 shadow-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="font-semibold text-neutral-900">My Notes</span>
          {savedNote && !isExpanded && (
            <span className="text-sm text-neutral-500 truncate max-w-xs">
              {savedNote.substring(0, 50)}...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-xs text-neutral-500 animate-pulse">
              Saving...
            </span>
          )}
          {hasUnsavedChanges && !saving && (
            <span className="text-xs text-amber-600">Unsaved</span>
          )}
          <svg
            className={`w-5 h-5 text-neutral-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-neutral-100">
          {loading ? (
            <div className="h-32 bg-neutral-100 animate-pulse rounded-xl mt-4" />
          ) : (
            <>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add your personal notes about this paper..."
                className="w-full mt-4 p-4 rounded-xl border-2 border-neutral-200 focus:border-primary-500 focus:ring-0 resize-none transition-colors min-h-[120px]"
                rows={4}
              />
              <p className="text-xs text-neutral-500 mt-2">
                Notes are saved automatically as you type
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
