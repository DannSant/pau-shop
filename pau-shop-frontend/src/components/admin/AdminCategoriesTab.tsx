import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAsyncData } from "../../hooks/useAsyncData";
import { fetchProducts } from "../../features/products/productsSlice";
import { createCategory, getCategories, updateCategory, type CategoryPayload } from "../../api/admin";
import type { Category } from "../../types/product";
import { t } from "../../i18n";
import { CARD, INPUT, LABEL, PRIMARY_BUTTON } from "./adminStyles";

interface FormValues {
  nameEs: string;
  nameEn: string;
  sortOrder: string;
}

const toPayload = (values: FormValues): CategoryPayload => ({
  name: { es: values.nameEs.trim(), en: values.nameEn.trim() },
  sort_order: Number.parseInt(values.sortOrder, 10) || 0,
});

const errorMessage = (err: unknown) =>
  axios.isAxiosError(err) && err.response?.status === 409
    ? t.admin.categoryExists
    : t.admin.categoryError;

function CategoryFields({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: (values: FormValues) => void;
}) {
  return (
    <>
      <div className="flex-1 min-w-40">
        <label className={LABEL}>{t.admin.categoryNameEs}</label>
        <input
          className={INPUT}
          value={values.nameEs}
          onChange={(e) => onChange({ ...values, nameEs: e.target.value })}
          required
        />
      </div>
      <div className="flex-1 min-w-40">
        <label className={LABEL}>{t.admin.categoryNameEn}</label>
        <input
          className={INPUT}
          value={values.nameEn}
          onChange={(e) => onChange({ ...values, nameEn: e.target.value })}
        />
      </div>
      <div className="w-24">
        <label className={LABEL}>{t.admin.sortOrder}</label>
        <input
          type="number"
          step={1}
          className={INPUT}
          value={values.sortOrder}
          onChange={(e) => onChange({ ...values, sortOrder: e.target.value })}
        />
      </div>
    </>
  );
}

function CategoryRow({ category, onSaved }: { category: Category; onSaved: () => void }) {
  const initial: FormValues = {
    nameEs: category.name.es,
    nameEn: category.name.en ?? "",
    sortOrder: String(category.sort_order),
  };
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  const changed = JSON.stringify(values) !== JSON.stringify(initial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCategory(category.id, toPayload(values));
      toast.success(t.admin.categorySaved);
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${CARD} flex flex-wrap items-end gap-4`}>
      <CategoryFields values={values} onChange={setValues} />
      <div>
        <p className="text-xs text-white/40 mb-2 font-mono">{category.slug}</p>
        <button type="submit" className={PRIMARY_BUTTON} disabled={!changed || saving}>
          {saving ? t.admin.saving : t.admin.save}
        </button>
      </div>
    </form>
  );
}

const EMPTY: FormValues = { nameEs: "", nameEn: "", sortOrder: "0" };

export default function AdminCategoriesTab() {
  const dispatch = useAppDispatch();
  const { data: categories, failed, reload } = useAsyncData(getCategories);
  const [newValues, setNewValues] = useState(EMPTY);
  const [creating, setCreating] = useState(false);

  // Product listings embed category names, so refresh them too.
  const handleSaved = () => {
    reload();
    dispatch(fetchProducts());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createCategory(toPayload(newValues));
      toast.success(t.admin.categoryCreated);
      setNewValues(EMPTY);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className={CARD}>
        <h2 className="text-xl font-semibold mb-4">{t.admin.newCategory}</h2>
        <div className="flex flex-wrap items-end gap-4">
          <CategoryFields values={newValues} onChange={setNewValues} />
          <button type="submit" className={PRIMARY_BUTTON} disabled={creating}>
            {creating ? t.admin.saving : t.admin.add}
          </button>
        </div>
      </form>

      <div>
        <p className="text-sm text-white/60 mb-3">{t.admin.slugNote}</p>
        {failed ? (
          <p className="text-red-400">{t.admin.loadError}</p>
        ) : !categories ? (
          <p>{t.admin.loading}</p>
        ) : categories.length === 0 ? (
          <p className="text-white/70">{t.admin.noCategories}</p>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              // Keyed by content so the row resets after a save.
              <CategoryRow
                key={`${category.id}:${JSON.stringify(category.name)}:${category.sort_order}`}
                category={category}
                onSaved={handleSaved}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
