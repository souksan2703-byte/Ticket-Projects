import { useState } from "react";
import { X } from "lucide-react";

export default function AddAdminUserModal({ onClose, onSave, initialData }) {
  const isEditing = Boolean(initialData);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    username: initialData?.username || "",
    password: "",
    role: initialData?.role || "User",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.username.trim()) {
      setError("กรุณากรอก Name และ Username ให้ครบ");
      return;
    }
    if (!isEditing && !form.password.trim()) {
      setError("กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่");
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
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            {isEditing ? "Edit admin user" : "Add admin user"}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">Name</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                placeholder="e.g. Bounmy Sihavong"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">Username</label>
              <input
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                disabled={isEditing} // เปลี่ยน username ทีหลังไม่ได้ กันงงเรื่อง unique constraint
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:opacity-60"
                placeholder="e.g. bounmy"
              />
            </div>
            {!isEditing && (
              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  placeholder="ตั้งรหัสผ่านเริ่มต้น"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">Role</label>
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
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
              disabled={saving}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? "กำลังบันทึก..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
