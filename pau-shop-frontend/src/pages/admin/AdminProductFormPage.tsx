import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAsyncData } from "../../hooks/useAsyncData";
import { fetchProducts } from "../../features/products/productsSlice";
import {
  createProduct,
  getAdminProduct,
  getCategories,
  updateProduct,
  type ProductPayload,
} from "../../api/admin";
import type { Category, Product } from "../../types/product";
import ProductImagesManager from "../../components/admin/ProductImagesManager";
import { localize, t } from "../../i18n";
import { CARD, INPUT, LABEL, PRIMARY_BUTTON } from "../../components/admin/adminStyles";

interface FormValues {
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  price: string;
  offerPrice: string;
  stock: string;
  categoryId: string;
  franchise: string;
}

function toFormValues(product: Product | null): FormValues {
  return {
    nameEs: product?.name.es ?? "",
    nameEn: product?.name.en ?? "",
    descriptionEs: product?.description?.es ?? "",
    descriptionEn: product?.description?.en ?? "",
    price: product ? String(product.price) : "",
    offerPrice: product?.offer_price != null ? String(product.offer_price) : "",
    stock: product ? String(product.stock) : "0",
    categoryId: product?.category_id ?? product?.category?.id ?? "",
    franchise: product?.franchise ?? "",
  };
}

function toPayload(values: FormValues): ProductPayload {
  return {
    name: { es: values.nameEs, en: values.nameEn },
    // Without a Spanish description there is no description at all.
    description: values.descriptionEs.trim()
      ? { es: values.descriptionEs, en: values.descriptionEn }
      : null,
    price: Number(values.price),
    offer_price: values.offerPrice.trim() === "" ? null : Number(values.offerPrice),
    stock: Number.parseInt(values.stock, 10),
    category_id: values.categoryId || null,
    franchise: values.franchise.trim() || null,
  };
}

function ProductForm({
  product,
  categories,
  franchises,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  franchises: string[];
  onSaved: (saved: Product) => void;
}) {
  const [values, setValues] = useState(() => toFormValues(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field = (key: keyof FormValues) => ({
    id: `product-${key}`,
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues({ ...values, [key]: e.target.value }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = toPayload(values);

    if (payload.offer_price !== null && payload.offer_price >= payload.price) {
      setError(t.admin.offerTooHigh);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const saved = product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);
      onSaved(saved);
    } catch {
      setError(t.admin.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${CARD} space-y-5`}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="product-nameEs" className={LABEL}>{t.admin.nameEs}</label>
          <input className={INPUT} required {...field("nameEs")} />
        </div>
        <div>
          <label htmlFor="product-nameEn" className={LABEL}>{t.admin.nameEn}</label>
          <input className={INPUT} {...field("nameEn")} />
        </div>
        <div>
          <label htmlFor="product-descriptionEs" className={LABEL}>{t.admin.descriptionEs}</label>
          <textarea className={INPUT} rows={4} {...field("descriptionEs")} />
        </div>
        <div>
          <label htmlFor="product-descriptionEn" className={LABEL}>{t.admin.descriptionEn}</label>
          <textarea className={INPUT} rows={4} {...field("descriptionEn")} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="product-price" className={LABEL}>{t.admin.price}</label>
          <input type="number" min="0.01" step="0.01" className={INPUT} required {...field("price")} />
        </div>
        <div>
          <label htmlFor="product-offerPrice" className={LABEL}>{t.admin.offerPrice}</label>
          <input type="number" min="0.01" step="0.01" className={INPUT} {...field("offerPrice")} />
          <p className="text-xs text-white/50 mt-1">{t.admin.offerPriceHint}</p>
        </div>
        <div>
          <label htmlFor="product-stock" className={LABEL}>{t.admin.stock}</label>
          <input type="number" min="0" step="1" className={INPUT} required {...field("stock")} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="product-categoryId" className={LABEL}>{t.admin.category}</label>
          <select className={INPUT} {...field("categoryId")}>
            <option value="">{t.admin.noCategory}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {localize(category.name)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product-franchise" className={LABEL}>{t.admin.franchise}</label>
          <input className={INPUT} list="admin-franchises" {...field("franchise")} />
          <datalist id="admin-franchises">
            {franchises.map((franchise) => (
              <option key={franchise} value={franchise} />
            ))}
          </datalist>
        </div>
      </div>

      {error && <p className="text-red-400">{error}</p>}

      <div className="flex justify-end">
        <button type="submit" className={PRIMARY_BUTTON} disabled={saving}>
          {saving ? t.admin.saving : t.admin.save}
        </button>
      </div>
    </form>
  );
}

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const storeProducts = useAppSelector((state) => state.products.items);

  const loadProduct = useCallback(
    () => (id ? getAdminProduct(id) : Promise.resolve(null)),
    [id]
  );
  const { data: product, failed, reload } = useAsyncData(loadProduct);
  const { data: categories } = useAsyncData(getCategories);

  // Suggestions for the franchise field.
  const franchises = useMemo(
    () => [...new Set(storeProducts.map((p) => p.franchise).filter(Boolean))].sort(),
    [storeProducts]
  );

  const handleSaved = (saved: Product) => {
    dispatch(fetchProducts()); // keep the store's product list in sync
    if (id) {
      toast.success(t.admin.saved);
      reload();
    } else {
      toast.success(t.admin.created);
      navigate(`/admin/products/${saved.id}`, { replace: true });
    }
  };

  const backLink = (
    <Link to="/admin" className="text-purple-300 hover:text-purple-200">
      ← {t.admin.backToProducts}
    </Link>
  );

  if (failed) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 text-white">
        <p className="mb-6">{t.admin.productNotFound}</p>
        {backLink}
      </div>
    );
  }

  const ready = product !== undefined && categories !== undefined;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 text-white space-y-6">
      {backLink}
      <h1 className="text-3xl font-bold">
        {id ? t.admin.editProductTitle : t.admin.newProductTitle}
      </h1>

      {!ready ? (
        <p>{t.admin.loading}</p>
      ) : (
        <>
          {product?.deleted_at && (
            <p className="rounded-xl border border-amber-400/40 bg-amber-500/20 text-amber-200 p-4 text-sm">
              {t.admin.deletedNotice}
            </p>
          )}

          <ProductForm
            key={product?.id ?? "new"}
            product={product}
            categories={categories}
            franchises={franchises}
            onSaved={handleSaved}
          />

          {product ? (
            <ProductImagesManager
              product={product}
              onChanged={() => {
                reload();
                dispatch(fetchProducts());
              }}
            />
          ) : (
            <p className="text-white/60">{t.admin.imagesAfterSave}</p>
          )}
        </>
      )}
    </div>
  );
}
