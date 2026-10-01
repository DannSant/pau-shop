import { useState } from "react";
import toast from "react-hot-toast";
import { deleteProductImage, setProductThumbnail, uploadProductImages } from "../../api/admin";
import type { Product } from "../../types/product";
import { t } from "../../i18n";
import { CARD, DANGER_BUTTON, SECONDARY_BUTTON } from "./adminStyles";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,image/avif";

export default function ProductImagesManager({
  product,
  onChanged,
}: {
  product: Product;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  // Main image first.
  const images = [...product.product_images].sort(
    (a, b) => Number(b.is_thumbnail) - Number(a.is_thumbnail)
  );

  const run = async (action: () => Promise<unknown>, errorText: string) => {
    setBusy(true);
    try {
      await action();
      onChanged();
    } catch {
      toast.error(errorText);
    } finally {
      setBusy(false);
    }
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same file again
    if (files.length === 0) return;
    run(() => uploadProductImages(product.id, files), t.admin.uploadError);
  };

  return (
    <div className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold">{t.admin.images}</h2>
          <p className="text-sm text-white/60">{t.admin.imagesHint}</p>
        </div>
        <label className={`${SECONDARY_BUTTON} ${busy ? "opacity-60 pointer-events-none" : ""}`}>
          {busy ? t.admin.uploading : t.admin.addImages}
          <input
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            className="hidden"
            onChange={handleFiles}
            disabled={busy}
          />
        </label>
      </div>

      {images.length === 0 ? (
        <p className="text-white/60">{t.admin.noImages}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative">
              <img src={image.url} alt="" className="w-full aspect-square object-cover rounded-lg" />
              {image.is_thumbnail && (
                <span className="absolute top-2 left-2 bg-purple-600 text-xs px-2 py-1 rounded-full">
                  {t.admin.mainImage}
                </span>
              )}
              <div className="flex gap-2 mt-2">
                {!image.is_thumbnail && (
                  <button
                    type="button"
                    className={`${SECONDARY_BUTTON} text-xs px-2 py-1`}
                    disabled={busy}
                    onClick={() => run(() => setProductThumbnail(product.id, image.id), t.admin.imageError)}
                  >
                    {t.admin.setMain}
                  </button>
                )}
                <button
                  type="button"
                  className={`${DANGER_BUTTON} text-xs px-2 py-1`}
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(t.admin.confirmDeleteImage)) {
                      run(() => deleteProductImage(product.id, image.id), t.admin.imageError);
                    }
                  }}
                >
                  {t.admin.deleteImage}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
