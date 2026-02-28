/**
 * Calendar Gemini Service — proxies AI calendar calls through the FastAPI backend.
 * The apiKey parameter is kept for backward compatibility but is no longer used.
 */

import { ParsedEventIntent, CalendarEvent } from "../types/calendarTypes";

const BASE = "/api/v1/gemini/calendar";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a date string to a local Date object.
 * If the date has Z suffix (UTC), it treats it as if it was local time instead.
 */
function parseAsLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  let cleanDateStr = dateStr;
  if (dateStr.endsWith("Z")) {
    cleanDateStr = dateStr.slice(0, -1);
  }
  const date = new Date(cleanDateStr);
  if (isNaN(date.getTime())) {
    return new Date(dateStr);
  }
  return date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API (signatures unchanged — apiKey ignored, backend uses ADC)
// ─────────────────────────────────────────────────────────────────────────────

export const parseNaturalLanguageEvent = async (
  input: string,
  currentDate: Date,
  _apiKey?: string
): Promise<ParsedEventIntent | null> => {
  try {
    const res = await fetch(`${BASE}/parse-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, currentDate: currentDate.toISOString() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.event) return null;

    const raw = data.event;
    const parsed: ParsedEventIntent = {
      title: raw.title,
      start: parseAsLocalDate(raw.start).toISOString(),
      end: parseAsLocalDate(raw.end).toISOString(),
      description: raw.description || "",
      location: raw.location || "",
      isAllDay: raw.isAllDay || false,
    };
    return parsed;
  } catch (error) {
    console.error("❌ Error parsing event via backend:", error);
    return null;
  }
};

export const answerScheduleQuery = async (
  query: string,
  events: CalendarEvent[],
  currentDate: Date,
  _apiKey?: string
): Promise<string> => {
  try {
    const simplifiedEvents = events.map((e) => ({
      title: e.title,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      source: e.source,
    }));

    const res = await fetch(`${BASE}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        events: simplifiedEvents,
        currentDate: currentDate.toISOString(),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.answer || "Je n'ai pas pu analyser votre emploi du temps pour le moment.";
  } catch (error) {
    console.error("❌ Schedule query error:", error);
    return "Désolé, j'ai rencontré une erreur en vérifiant votre emploi du temps.";
  }
};
