import { es } from "./es";
import { en } from "./en";
import type { LocalizedText } from "../types/localized";

export const LANGUAGES = ["es", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = "language";
const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.includes(value as Language);

// The chosen language is read once at startup. Switching saves the choice and
// reloads the page, so every string (and every cached date) uses the new one.
function storedLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // storage blocked: use the default
  }
  return "es";
}

export const language: Language = storedLanguage();
export const locale = language === "en" ? "en-US" : "es-MX";
export const t = language === "en" ? en : es;

document.documentElement.lang = language;

export function setLanguage(next: Language) {
  if (next === language) return;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    return; // can't remember the choice, so a reload wouldn't change anything
  }
  window.location.reload();
}

// Picks the current language from text stored in the database.
export function localize(text: LocalizedText | null | undefined): string {
  if (!text) return "";
  return text[language] || text.es || "";
}
