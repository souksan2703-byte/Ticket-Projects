import { useRef, useState } from "react";
import { X, Upload, Download, Trash2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { uploadImage, getImageUrl } from "../api.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB, ตรงกับ limit ฝั่ง backend (multer)

export default function AddTicketModal({ onClose, onSave, initialData }) {
  const { t } = useLanguage();
  const isEditing = Boolean(initialData);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    price: initialData?.price ?? "",
    stock: initialData?.stock ?? "",
    location: initialData?.location || "",
    date: initialData?.date || "",
    status: initialData?.status || "Open",
    logo: initialData?.logo || null,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFile(file) {
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t("photoTypeError"));
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(t("photoSizeError"));
      return;
    }

    setUploading(true);
    try {
      const path = await uploadImage(file);
      update("logo", path);
    } catch (err) {
      setError(err.message || t("photoUploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  function handleBrowseClick() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e) {
    handleFile(e.target.files?.[0]);
    e.target.value = ""; // เคลียร์ไว้ เผื่อเลือกไฟล์เดิมซ้ำอีกครั้งจะได้ trigger onChange ใหม่
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  function handleRemovePhoto(e) {
    e.stopPropagation();
    update("logo", null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || form.price === "" || form.stock === "") {
      setError(t("fillEventPriceStock"));
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message || t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isEditing ? t("editTicket") : t("addTicket")}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {form.logo ? (
            <div className="mb-5 flex items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <img
                src={getImageUrl(form.logo)}
                alt={t("uploadEventPhoto")}
                className="h-20 w-20 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-700">
                  {t("photoAttached")}
                </p>
                <div className="mt-1.5 flex items-center gap-3">
                  <a
                    href={getImageUrl(form.logo)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t("downloadPhoto")}
                  </a>
                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    className="text-xs font-medium text-neutral-600 hover:underline"
                  >
                    {t("replacePhoto")}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("removePhoto")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={handleBrowseClick}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`mb-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition ${
                dragActive
                  ? "border-red-400 bg-red-50"
                  : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100"
              }`}
            >
              <Upload className="mb-2 h-5 w-5 text-neutral-400" />
              <p className="text-sm font-medium text-neutral-700">
                {uploading ? t("uploadingEllipsis") : t("uploadEventPhoto")}
              </p>
              <p className="mt-1 text-xs text-neutral-400">{t("dragDropHint")}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">{t("eventTitle")}</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                placeholder="e.g. Sunset Music Festival"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">{t("priceLak")}</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  placeholder="690000"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">{t("colStock")}</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => update("stock", e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  placeholder="120"
                />
                {!isEditing && (
                  <p className="mt-1 text-xs text-neutral-400">
                    {t("autoGenCodesHint")}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">{t("location")}</label>
              <input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                placeholder="e.g. Riverside Grounds"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">{t("colDateTime")}</label>
              <input
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                placeholder="e.g. Oct 4, 2026, 17:00 - 23:30"
              />
            </div>

            {isEditing && (
              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">{t("colStatus")}</label>
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="Open">{t("statusOpen")}</option>
                  <option value="OFF">{t("statusOff")}</option>
                </select>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? t("savingEllipsis") : t("saveTicket")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
