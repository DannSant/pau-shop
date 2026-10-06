import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useAppSelector } from "../../hooks/useAppSelector";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  updateAddress,
} from "../../features/address/addressSlice";
import AddressForm from "../checkout/AddressForm";
import type { Address } from "../../types/address";
import { t } from "../../i18n";

const PRIMARY_BUTTON =
  "bg-purple-600 hover:bg-purple-700 transition px-6 py-2 rounded-xl cursor-pointer disabled:opacity-60";
const SECONDARY_BUTTON =
  "px-4 py-2 rounded-xl border border-white/30 hover:bg-white/10 transition cursor-pointer disabled:opacity-60";

// The address being edited: an existing one (by id) or "new".
type Editing = { id: string | "new"; draft: Address | null } | null;

export default function AddressesTab() {
  const dispatch = useAppDispatch();
  const { addresses, loading } = useAppSelector((state) => state.address);

  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const startEditing = (address: Address | null) => {
    setEditing({ id: address?.id ?? "new", draft: address });
    setSaveError(false);
  };

  const handleSave = async () => {
    if (!editing?.draft) {
      setSaveError(true);
      return;
    }

    setSaving(true);
    setSaveError(false);
    try {
      await dispatch(
        editing.id === "new" ? createAddress(editing.draft) : updateAddress(editing.draft)
      ).unwrap();
      toast.success(t.profile.addressSaved);
      setEditing(null);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address: Address) => {
    if (!window.confirm(t.profile.confirmDeleteAddress)) return;

    setDeletingId(address.id!);
    try {
      await dispatch(deleteAddress(address.id!)).unwrap();
      toast.success(t.profile.addressDeleted);
    } catch (reason) {
      toast.error(reason === "in_use" ? t.profile.addressInUse : t.profile.addressDeleteError);
    } finally {
      setDeletingId(null);
    }
  };

  const form = editing && (
    <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
      {/* key: a fresh form for each address, since the form keeps its own state. */}
      <AddressForm
        key={editing.id}
        initialAddress={editing.draft ?? undefined}
        onChange={(draft) => setEditing((prev) => prev && { ...prev, draft })}
      />

      {saveError && (
        <p role="alert" className="mt-4 text-red-300 text-sm">
          {t.address.saveError}
        </p>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <button type="button" onClick={() => setEditing(null)} className={SECONDARY_BUTTON} disabled={saving}>
          {t.profile.cancel}
        </button>
        <button type="button" onClick={handleSave} className={PRIMARY_BUTTON} disabled={saving}>
          {saving ? t.profile.saving : t.profile.save}
        </button>
      </div>
    </div>
  );

  if (loading && addresses.length === 0 && !editing) {
    return <p>{t.profile.addressesLoading}</p>;
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 && !editing && (
        <p className="text-white/60">{t.profile.noAddresses}</p>
      )}

      {addresses.map((address) =>
        editing?.id === address.id ? (
          <div key={address.id}>{form}</div>
        ) : (
          <div key={address.id} className="bg-white/10 backdrop-blur rounded-2xl p-6">
            <p className="font-semibold">
              {address.first_name} {address.last_name} · {address.phone}
            </p>
            <p>
              {address.street} {address.exterior_number}
              {address.interior_number ? ` ${address.interior_number}` : ""}
            </p>
            <p>
              {address.neighborhood}, {address.city}, {address.state} {address.postal_code}
            </p>
            {address.special_instructions && (
              <p className="mt-2 text-sm text-white/70 whitespace-pre-line">
                {address.special_instructions}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => handleDelete(address)}
                className="px-4 py-2 rounded-xl border border-red-400/50 text-red-300 hover:bg-red-500/20 transition cursor-pointer disabled:opacity-60"
                disabled={deletingId === address.id || editing !== null}
              >
                {t.profile.deleteAddress}
              </button>
              <button
                type="button"
                onClick={() => startEditing(address)}
                className={SECONDARY_BUTTON}
                disabled={editing !== null}
              >
                {t.profile.editAddress}
              </button>
            </div>
          </div>
        )
      )}

      {editing?.id === "new" ? (
        form
      ) : (
        <button
          type="button"
          onClick={() => startEditing(null)}
          className={PRIMARY_BUTTON}
          disabled={editing !== null}
        >
          {t.profile.addAddress}
        </button>
      )}
    </div>
  );
}
