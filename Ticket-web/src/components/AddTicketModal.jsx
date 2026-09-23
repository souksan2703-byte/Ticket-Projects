import { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { uploadImage, getImageUrl } from "../api.js";

export default function AddTicketModal({ onClose, onSave, initialData }) {
  const isEditing = Boolean(initialData);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    price: initialData?.price ?? "",
    stock: initialData?.stock ?? "",
    location: initialData?.location || "",
    date: initialData?.date || "",
    status: initialData?.status || "Open",
    logo: initialData?.logo || "", // เก็บ path ของรูปที่อัปโหลดแล้ว (เช่น "/uploads/xxx.jpg")
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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
      e.target.value = ""; // เคลียร์ input เผื่ออยากเลือกไฟล์เดิมซ้ำได้
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || form.price === "" || form.stock === "") {
      setError("กรุณากรอก Event title, Price และ Stock ให้ครบ");
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isEditing ? "Edit ticket" : "Add ticket"}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* กล่องอัปโหลดรูป - คลิกที่ไหนก็ได้ในกล่องนี้เพื่อเลือกไฟล์ */}
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
            className="mb-5 flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center transition hover:bg-neutral-100 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="mb-2 h-5 w-5 animate-spin text-neutral-400" />
                <p className="text-sm font-medium text-neutral-700">กำลังอัปโหลด...</p>
              </>
            ) : form.logo ? (
              <>
                <img
                  src={getImageUrl(form.logo)}
                  alt="ตัวอย่างรูปอีเวนต์"
                  className="mb-3 h-32 w-32 rounded-lg object-cover"
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

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? "กำลังบันทึก..." : "Save ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
