import { LANGUAGES, language, setLanguage, t } from "../../i18n";

// "ES | EN" toggle in the navbar. Choosing a language reloads the page.
export default function LanguageSwitcher() {
  return (
    <div
      role="group"
      aria-label={t.navbar.language}
      className="flex rounded-full border border-purple-200 overflow-hidden text-xs font-semibold"
    >
      {LANGUAGES.map((lang) => {
        const active = lang === language;
        return (
          <button
            key={lang}
            type="button"
            lang={lang}
            aria-pressed={active}
            onClick={() => setLanguage(lang)}
            className={`px-2.5 py-1 transition ${
              active
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:text-purple-600"
            }`}
          >
            {lang.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
