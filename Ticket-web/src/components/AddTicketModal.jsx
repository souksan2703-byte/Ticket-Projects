import { useState } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { uploadImage, getImageUrl } from "../api";

export default function AddTicketModal({ onClose, onSave, initialData }) {
  const { t } = useLanguage();
  const isEditing = Boolean(initialData);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    price: initialData?.price ?? "",
    stock: initialData?.stock ?? "",
    location: initialData?.location || "",
    date: initialData?.date || "",
    status: initialData?.status || "Open",

    // path ของรูปที่เก็บใน SQL Server
    logo: initialData?.logo || "",
  });

  const [preview, setPreview] = useState(
    initialData?.logo ? getImageUrl(initialData.logo) : ""
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function update(field, value) {
    setForm((f) => ({
      ...f,
      [field]: value,
    }));
  }

  // =========================
  // Upload รูปภาพ
  // =========================
  async function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);

    // ตรวจชนิดไฟล์
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ GIF เท่านั้น");
      return;
    }

    // ตรวจขนาดไฟล์ 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 5MB)");
      return;
    }

    // แสดง Preview จากไฟล์ที่เลือกทันที
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      setUploading(true);

      // Upload ไป Node.js + Multer
      const imagePath = await uploadImage(file);

      console.log("Uploaded image:", imagePath);

      // เก็บ path ไว้ใน form
      // เช่น /uploads/abc123.jpg
      update("logo", imagePath);

      // เปลี่ยน preview ให้ใช้ URL จาก backend
      setPreview(getImageUrl(imagePath));
    } catch (err) {
      console.error("Upload image error:", err);

      setError(err.message || "อัปโหลดรูปไม่สำเร็จ");

      // ถ้า upload ไม่สำเร็จ ไม่เก็บ logo
      update("logo", "");
    } finally {
      setUploading(false);
    }
  }

  // =========================
  // Save Ticket
  // =========================
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || form.price === "" || form.stock === "") {
      setError(t("fillEventPriceStock"));
      return;
    }

    // ถ้ากำลัง upload อยู่ ห้าม Save
    if (uploading) {
      setError("กรุณารอให้รูปภาพอัปโหลดเสร็จก่อน");
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
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isEditing ? t("editTicket") : t("addTicket")}
          </h2>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* =========================
              Upload Event Photo
          ========================= */}
          <div className="mb-5">

            <label
              htmlFor="event-image"
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center hover:bg-neutral-100"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Event preview"
                  className="mb-4 h-48 w-full rounded-lg object-cover"
                />
              ) : (
                <>
                  <Upload className="mb-2 h-5 w-5 text-neutral-400" />

                  <p className="text-sm font-medium text-neutral-700">
                    {t("uploadEventPhoto")}
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    {t("dragDropHint")}
                  </p>
                </>
              )}

              <span className="mt-2 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
                <ImageIcon className="h-4 w-4" />

                {uploading
                  ? "Uploading..."
                  : preview
                    ? "Change Photo"
                    : "Choose Photo"}
              </span>
            </label>

            <input
              id="event-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              disabled={uploading}
              className="hidden"
            />

            {/* Path ที่จะส่งไป SQL Server */}
            {form.logo && (
              <p className="mt-2 break-all text-xs text-neutral-400">
                {form.logo}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* =========================
              Ticket Information
          ========================= */}
          <div className="space-y-4">

            {/* Event Title */}
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">
                {t("eventTitle")}
              </label>

              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                placeholder="e.g. Sunset Music Festival"
              />
            </div>

            {/* Price + Stock */}
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">
                  {t("priceLak")}
                </label>

                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  placeholder="690000"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">
                  {t("colStock")}
                </label>

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

            {/* Location */}
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">
                {t("location")}
              </label>

              <input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                placeholder="e.g. Riverside Grounds"
              />
            </div>

            {/* Date */}
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">
                {t("colDateTime")}
              </label>

              <input
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                placeholder="e.g. Oct 4, 2026, 17:00 - 23:30"
              />
            </div>

            {/* Status */}
            {isEditing && (
              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">
                  {t("colStatus")}
                </label>

                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="Open">
                    {t("statusOpen")}
                  </option>

                  <option value="OFF">
                    {t("statusOff")}
                  </option>
                </select>
              </div>
            )}

          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-3">

            <button
              type="button"
              onClick={onClose}
              disabled={saving || uploading}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              {t("cancel")}
            </button>

            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {uploading
                ? "Uploading..."
                : saving
                  ? t("savingEllipsis")
                  : t("saveTicket")}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}