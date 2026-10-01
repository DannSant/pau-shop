import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAsyncData } from "../../hooks/useAsyncData";
import { fetchProducts } from "../../features/products/productsSlice";
import { deleteProduct, getAdminProducts, restoreProduct } from "../../api/admin";
import type { Product } from "../../types/product";
import { localize, t } from "../../i18n";
import { CARD, DANGER_BUTTON, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./adminStyles";

const formatMoney = (amount: number) => `$${amount.toFixed(2)}`;

export default function AdminProductsTab() {
  const dispatch = useAppDispatch();
  const [showDeleted, setShowDeleted] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => getAdminProducts(showDeleted), [showDeleted]);
  const { data: products, loading, failed, reload } = useAsyncData(load);

  const runAction = async (product: Product, action: "delete" | "restore") => {
    if (action === "delete" && !window.confirm(t.admin.confirmDelete(localize(product.name)))) {
      return;
    }

    setBusyId(product.id);
    try {
      if (action === "delete") await deleteProduct(product.id);
      else await restoreProduct(product.id);

      toast.success(action === "delete" ? t.admin.deletedToast : t.admin.restoredToast);
      reload();
      dispatch(fetchProducts()); // keep the store's product list in sync
    } catch {
      toast.error(t.admin.actionError);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-2">
          {[false, true].map((deleted) => (
            <button
              key={String(deleted)}
              type="button"
              onClick={() => setShowDeleted(deleted)}
              className={`px-4 py-1.5 rounded-full text-sm cursor-pointer transition ${
                showDeleted === deleted ? "bg-purple-600" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {deleted ? t.admin.deleted : t.admin.active}
            </button>
          ))}
        </div>

        <Link to="/admin/products/new" className={PRIMARY_BUTTON}>
          {t.admin.newProduct}
        </Link>
      </div>

      {failed ? (
        <p className="text-red-400">{t.admin.loadError}</p>
      ) : !products ? (
        <p>{t.admin.loading}</p>
      ) : products.length === 0 ? (
        <p className="text-white/70">{showDeleted ? t.admin.noDeleted : t.admin.noProducts}</p>
      ) : (
        <div className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
          {products.map((product) => {
            const thumbnail =
              product.product_images.find((img) => img.is_thumbnail)?.url ??
              product.product_images[0]?.url;

            return (
              <div key={product.id} className={`${CARD} flex flex-wrap items-center gap-4`}>
                {thumbnail ? (
                  <img src={thumbnail} alt="" className="w-16 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white/10" />
                )}

                <div className="flex-1 min-w-48">
                  <p className="font-semibold">{localize(product.name)}</p>
                  <p className="text-sm text-white/60">
                    {product.category ? localize(product.category.name) : t.admin.noCategory}
                    {product.franchise ? ` · ${product.franchise}` : ""}
                  </p>
                </div>

                <div className="text-sm text-right">
                  {product.offer_price !== null ? (
                    <p>
                      <span className="line-through text-white/50 mr-2">{formatMoney(product.price)}</span>
                      <span className="font-semibold">{formatMoney(product.offer_price)}</span>
                    </p>
                  ) : (
                    <p className="font-semibold">{formatMoney(product.price)}</p>
                  )}
                  <p className="text-white/60">
                    {t.admin.stock}: {product.stock}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link to={`/admin/products/${product.id}`} className={SECONDARY_BUTTON}>
                    {t.admin.edit}
                  </Link>
                  {showDeleted ? (
                    <button
                      type="button"
                      className={SECONDARY_BUTTON}
                      disabled={loading || busyId === product.id}
                      onClick={() => runAction(product, "restore")}
                    >
                      {t.admin.restore}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={DANGER_BUTTON}
                      disabled={loading || busyId === product.id}
                      onClick={() => runAction(product, "delete")}
                    >
                      {t.admin.delete}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
