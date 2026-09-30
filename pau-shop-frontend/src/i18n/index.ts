import { es } from "./es";
import type { LocalizedText } from "../types/localized";

export const t = es; // later we can switch language
export const language = "es";
export const locale = "es-MX";

// Picks the current language from text stored in the database.
export function localize(text: LocalizedText | null | undefined): string {
  if (!text) return "";
  return text[language] || text.es || "";
}
