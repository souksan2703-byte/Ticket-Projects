<<<<<<< Updated upstream
import { useState } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { uploadImage, getImageUrl } from "../api";

function parseEventDateTime(value) {
  if (!value) {
    return { date: "", start: "", end: "" };
  }

  const timeMatch = value.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);

  const datePart = timeMatch
    ? value.slice(0, timeMatch.index).replace(/[,\s]+$/, "")
    : value;

  let date = "";

  if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
    date = datePart.slice(0, 10);
  } else {
    const parsed = new Date(datePart);

    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");

      date = `${year}-${month}-${day}`;
    }
  }

  return {
    date,
    start: timeMatch?.[1] || "",
    end: timeMatch?.[2] || "",
  };
}
=======
import { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { uploadImage, getImageUrl } from "../api.js";
>>>>>>> Stashed changes

export default function AddTicketModal({ onClose, onSave, initialData }) {
  const isEditing = Boolean(initialData);
  const fileInputRef = useRef(null);

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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Date & Time
  const initialDateTime = parseEventDateTime(initialData?.date);
  const [eventDate, setEventDate] = useState(initialDateTime.date);
  const [endDate, setEndDate] = useState(initialDateTime.date);
  const [startTime, setStartTime] = useState(initialDateTime.start);
  const [endTime, setEndTime] = useState(initialDateTime.end);

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
      setError("ຮອງຮັບສະເພາະໄຟລ໌ JPG, PNG, WEBP, ແລະ GIF ເທົ່ານັ້ນ");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("ໄຟລ໌ໃຫຍ່ເກີນໄປ (ສູງສຸດ 5MB)");
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
      setError(err.message || "ອັບໂຫຼດຮູບພາບບໍ່ສຳເລັດ");
      update("logo", "");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const path = await uploadImage(file);
      update("logo", path);
    } catch (err) {
      setError(err.message || "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

<<<<<<< Updated upstream
    if (!form.name.trim() || form.price === "") {
      setError(t("fillEventPriceStock"));
=======
    if (!form.name.trim() || form.price === "" || form.stock === "") {
      setError("กรุณากรอก Event title, Price และ Stock ให้ครบ");
>>>>>>> Stashed changes
      return;
    }

    if (!isEditing && form.stock === "") {
      setError(t("fillEventPriceStock"));
      return;
    }

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
      setError("ກະລຸນາລໍຖ້າໃຫ້ຮູບພາບອັບໂຫລດສຳເລັດ");
      return;
    }

    if (!eventDate || !endDate || !startTime || !endTime) {
      setError("ກະລຸນາເລືອກວັນເລີ່ມ ວັນສິ້ນສຸດ ແລະເວລາໃຫ້ຄົບ");
      return;
    }

    if (startTime >= endTime) {
      setError("ເວລາສິ້ນສຸດຕ້ອງຫຼາຍກວ່າເວລາເລີ່ມ");
      return;
    }
    if (endDate === eventDate && startTime >= endTime) {
      setError("ເວລາສິ້ນສຸດຕ້ອງຫຼັງເວລາເລີ່ມ");
      return;
    }

    setSaving(true);

    // รวม Date + Start time + End time
    const dateTimeValue = `${eventDate} ${startTime} - ${endTime}`;

    const submitData = {
      ...form,
      date: dateTimeValue,
    };

    try {
      await onSave(submitData);
    } catch (err) {
      setError(err.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
<<<<<<< Updated upstream
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
=======
    // เพิ่ม padding บน-ล่างให้กรอบนอก กันไม่ให้ modal ชนขอบจอบนสุด/ล่างสุดพอดี
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4 py-8">
      {/* จุดสำคัญที่แก้: max-h-[85vh] + overflow-y-auto ทำให้ modal เลื่อนได้เองถ้าเนื้อหายาวเกินจอ
          ปุ่ม Save จะเข้าถึงได้เสมอไม่ว่ารูปจะใหญ่แค่ไหน */}
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 p-6 pb-4">
>>>>>>> Stashed changes
          <h2 className="text-lg font-semibold text-neutral-900">
            {isEditing ? "Edit ticket" : "Add ticket"}
          </h2>

          <button
            onClick={onClose}
            disabled={saving || uploading}
            className="text-neutral-400 hover:text-neutral-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

<<<<<<< Updated upstream
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
                    value={form.additionalTickets}
                    onChange={(e) =>
                      update("additionalTickets", e.target.value)
                    }
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    placeholder="0"
                  />

                  <p className="mt-1 text-xs text-neutral-400">
                    {t("AddTicketsHint")}
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
            {/* End Date */}
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">
                End date
              </label>
              <input
                type="date"
                value={endDate}
                min={eventDate}
                onChange={(e) => setEndDate(e.target.value)}
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
=======
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* ส่วนเนื้อหาที่เลื่อนได้ (ฟอร์มทั้งหมด รวมรูป) แยกจาก header/footer ที่ตรึงอยู่กับที่ */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mb-5 flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-6 py-6 text-center transition hover:bg-neutral-100 disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="mb-2 h-5 w-5 animate-spin text-neutral-400" />
                  <p className="text-sm font-medium text-neutral-700">กำลังอัปโหลด...</p>
                </>
              ) : form.logo ? (
                <>
                  {/* จำกัดขนาด preview ให้เล็กและคงที่เสมอ ไม่ว่ารูปต้นฉบับจะใหญ่/สัดส่วนแปลกแค่ไหน */}
                  <img
                    src={getImageUrl(form.logo)}
                    alt="ตัวอย่างรูปอีเวนต์"
                    className="mb-3 h-24 w-24 rounded-lg object-cover"
                  />
                  <p className="text-xs text-neutral-500">คลิกเพื่อเปลี่ยนรูป</p>
                </>
              ) : (
                <>
                  <Upload className="mb-2 h-5 w-5 text-neutral-400" />
                  <p className="text-sm font-medium text-neutral-700">Upload event photo</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Drag and drop or click to browse. JPG, PNG, WEBP or GIF, up to 5 MB.
                  </p>
                </>
              )}
            </button>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
>>>>>>> Stashed changes
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">Event title</label>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  placeholder="e.g. Sunset Music Festival"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm text-neutral-700">Price (LAK)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => update("price", e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    placeholder="690000"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-neutral-700">Stock</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => update("stock", e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    placeholder="120"
                  />
                  {!isEditing && (
                    <p className="mt-1 text-xs text-neutral-400">
                      ระบบจะสร้างโค้ดตั๋วให้อัตโนมัติตามจำนวนนี้ (สูงสุด 1000 ใบ)
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  placeholder="e.g. Riverside Grounds"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">Date and time</label>
                <input
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  placeholder="e.g. Oct 4, 2026, 17:00 - 23:30"
                />
              </div>

              {isEditing && (
                <div>
                  <label className="mb-1.5 block text-sm text-neutral-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => update("status", e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  >
                    <option value="Open">Open</option>
                    <option value="OFF">OFF</option>
                  </select>
                </div>
              )}
            </div>
          </div>

<<<<<<< Updated upstream
          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-3">
=======
          {/* Footer ตรึงอยู่กับที่เสมอ ไม่เลื่อนหายไปไหน กดถึงได้ตลอดไม่ว่าเนื้อหาข้างบนจะยาวแค่ไหน */}
          <div className="flex justify-end gap-3 border-t border-neutral-100 p-6 pt-4">
>>>>>>> Stashed changes
            <button
              type="button"
              onClick={onClose}
              disabled={saving || uploading}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
<<<<<<< Updated upstream
              {uploading
                ? "Uploading..."
                : saving
                  ? t("savingEllipsis")
                  : t("saveTicket")}
=======
              {saving ? "กำลังบันทึก..." : "Save ticket"}
>>>>>>> Stashed changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}