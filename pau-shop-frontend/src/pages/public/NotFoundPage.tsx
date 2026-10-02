import { Link } from "react-router-dom";
import { t } from "../../i18n";

export default function NotFoundPage() {
  return (
    <div className="max-w-xl mx-auto text-center text-white py-16">
      <p className="text-7xl font-bold text-purple-400 mb-4">404</p>
      <h1 className="text-3xl font-bold mb-3">{t.notFound.title}</h1>
      <p className="text-white/70 mb-8">{t.notFound.body}</p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/"
          className="bg-purple-600 hover:bg-purple-700 transition px-6 py-3 rounded-xl"
        >
          {t.notFound.home}
        </Link>
        <Link
          to="/browse"
          className="bg-white/10 hover:bg-white/20 transition px-6 py-3 rounded-xl"
        >
          {t.notFound.browse}
        </Link>
      </div>
    </div>
  );
}
