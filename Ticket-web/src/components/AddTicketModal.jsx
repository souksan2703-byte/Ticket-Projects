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
    additionalTickets: "",
    location: initialData?.location || "",
    date: initialData?.date || "",
    status: initialData?.status || "Open",
    logo: initialData?.logo || "",
  });

  const [preview, setPreview] = useState(
    initialData?.logo ? getImageUrl(initialData.logo) : "",
  );

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Date & Time
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  function update(field, value) {
    setForm((f) => ({
      ...f,
      [field]: value,
    }));
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setError("รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ GIF เท่านั้น");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("ไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 5MB)");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      setUploading(true);

      const imagePath = await uploadImage(file);

      console.log("Uploaded image:", imagePath);

      update("logo", imagePath);
      setPreview(getImageUrl(imagePath));
    } catch (err) {
      console.error("Upload image error:", err);
      setError(err.message || "อัปโหลดรูปไม่สำเร็จ");
      update("logo", "");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || form.price === "") {
      setError(t("fillEventPriceStock"));
      return;
    }

    // ตอนสร้าง Event ใหม่ ต้องกรอก Stock
    if (!isEditing && form.stock === "") {
      setError(t("fillEventPriceStock"));
      return;
    }

    // Add Tickets ต้องเป็นจำนวนเต็ม 0 ขึ้นไป
    if (isEditing) {
      const additionalTickets = Number(form.additionalTickets || 0);

      if (!Number.isInteger(additionalTickets) || additionalTickets < 0) {
        setError(t("invalidAdditionalTickets"));
        return;
      }

      if (additionalTickets > 1000) {
        setError(t("maxAdditionalTickets"));
        return;
      }
    }

    if (uploading) {
      setError("กรุณารอให้รูปภาพอัปโหลดเสร็จก่อน");
      return;
    }

    setSaving(true);
    if (!eventDate || !startTime || !endTime) {
      setError("กรุณาเลือกวันที่ เวลาเริ่ม และเวลาสิ้นสุด");
      return;
    }

    if (startTime >= endTime) {
      setError("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม");
      return;
    }

    // รวม Date + Start time + End time
    const dateTimeValue = `${eventDate} ${startTime} - ${endTime}`;

    const submitData = {
      ...form,
      date: dateTimeValue,
    };

    try {
      await onSave(submitData);
    } catch (err) {
      setError(err.message || t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isEditing ? t("editTicket") : t("addTicket")}
          </h2>

          <button
            onClick={onClose}
            disabled={saving || uploading}
            className="text-neutral-400 hover:text-neutral-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Event Image */}
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

            {/* Price - Full Width */}
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

            {/* Tickets */}
            {isEditing ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Current Tickets */}
                <div>
                  <label className="mb-1.5 block text-sm text-neutral-700">
                    {t("currentTickets")}
                  </label>

                  <input
                    type="number"
                    value={form.stock}
                    readOnly
                    className="w-full cursor-not-allowed rounded-lg border border-neutral-200 bg-neutral-100 px-3.5 py-2.5 text-sm text-neutral-500 outline-none"
                  />

                  <p className="mt-1 text-xs text-neutral-400">
                    {t("currentTicketsHint")}
                  </p>
                </div>

                {/* Add Tickets */}
                <div>
                  <label className="mb-1.5 block text-sm text-neutral-700">
                    {t("addTickets")}
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={form.additionalTickets}
                    onChange={(e) =>
                      update("additionalTickets", e.target.value)
                    }
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    placeholder="0"
                  />

                  <p className="mt-1 text-xs text-neutral-400">
                    {t("addTicketsHint")}
                  </p>
                </div>
              </div>
            ) : (
              /* Add New Event */
              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">
                  {t("colStock")}
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => update("stock", e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  placeholder="120"
                />

                <p className="mt-1 text-xs text-neutral-400">
                  {t("autoGenCodesHint")}
                </p>
              </div>
            )}

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
                Date
              </label>

              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">
                Start time
              </label>

              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">
                End time
              </label>

              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
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
                  <option value="Open">{t("statusOpen")}</option>
                  <option value="OFF">{t("statusOff")}</option>
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
