import { locale } from "../i18n";

// "2 de octubre de 2026" / "October 2, 2026"
export const formatLongDate = (date: string) =>
  new Date(date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
