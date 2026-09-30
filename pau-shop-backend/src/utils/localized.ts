// Text stored per language, e.g. { es: "Botella Nuka", en: "Nuka Bottle" }.
// Spanish is the default language and is always required.
export type LocalizedText = { es: string; [lang: string]: string };

export function isLocalizedText(value: unknown): value is LocalizedText {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const entries = Object.values(value as Record<string, unknown>);
  const es = (value as Record<string, unknown>).es;

  return (
    entries.every((v) => typeof v === "string") &&
    typeof es === "string" &&
    es.trim() !== ""
  );
}

export function localize(text: LocalizedText | null | undefined, lang = "es") {
  if (!text) return "";
  return text[lang] || text.es;
}
