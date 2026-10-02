import { useSearchParams } from "react-router-dom";
import AdminProductsTab from "../../components/admin/AdminProductsTab";
import AdminCategoriesTab from "../../components/admin/AdminCategoriesTab";
import AdminOrdersTab from "../../components/admin/AdminOrdersTab";
import AdminReviewsTab from "../../components/admin/AdminReviewsTab";
import { t } from "../../i18n";

const TABS = ["products", "categories", "orders", "reviews"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  // The tab lives in the URL so "back" from a product returns to the right tab.
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab") as Tab | null;
  const activeTab: Tab = requested && TABS.includes(requested) ? requested : "products";

  const labels: Record<Tab, string> = {
    products: t.admin.tabProducts,
    categories: t.admin.tabCategories,
    orders: t.admin.tabOrders,
    reviews: t.admin.tabReviews,
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-8">{t.admin.title}</h1>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/20">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSearchParams(tab === "products" ? {} : { tab })}
            className={`px-4 py-2 -mb-px border-b-2 transition cursor-pointer ${
              activeTab === tab
                ? "border-purple-500 text-white font-semibold"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            {labels[tab]}
          </button>
        ))}
      </div>

      {activeTab === "products" && <AdminProductsTab />}
      {activeTab === "categories" && <AdminCategoriesTab />}
      {activeTab === "orders" && <AdminOrdersTab />}
      {activeTab === "reviews" && <AdminReviewsTab />}
    </div>
  );
}
