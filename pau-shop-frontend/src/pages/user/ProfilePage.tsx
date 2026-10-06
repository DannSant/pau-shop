import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { fetchProfile } from "../../features/profile/profileSlice";
import ProfileGeneralTab from "../../components/profile/ProfileGeneralTab";
import OrderHistoryTab from "../../components/profile/OrderHistoryTab";
import AddressesTab from "../../components/profile/AddressesTab";
import { t } from "../../i18n";

type Tab = "general" | "addresses" | "orders";

const TABS_IN_URL: Tab[] = ["addresses", "orders"];

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  // The tab lives in the URL so "back" from an order returns to the orders tab.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const activeTab: Tab = tabParam && TABS_IN_URL.includes(tabParam) ? tabParam : "general";

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: t.profile.tabGeneral },
    { id: "addresses", label: t.profile.tabAddresses },
    { id: "orders", label: t.profile.tabOrders },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-8">{t.profile.title}</h1>

      <div className="flex gap-2 mb-8 border-b border-white/20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setSearchParams(TABS_IN_URL.includes(tab.id) ? { tab: tab.id } : {})
            }
            className={`px-4 py-2 -mb-px border-b-2 transition cursor-pointer ${
              activeTab === tab.id
                ? "border-purple-500 text-white font-semibold"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && <ProfileGeneralTab />}
      {activeTab === "addresses" && <AddressesTab />}
      {activeTab === "orders" && <OrderHistoryTab />}
    </div>
  );
}
