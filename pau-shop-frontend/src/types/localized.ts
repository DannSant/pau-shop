// Text stored per language, e.g. { es: "Botella Nuka", en: "Nuka Bottle" }.
// Spanish is the default language and is always present.
export type LocalizedText = { es: string; [lang: string]: string };
