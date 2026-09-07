import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import { changeOwnPassword } from "../api.js";

export default function MyProfilePage({ currentUser }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || !confirmPassword) {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    if (newPassword.length < 6) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setSaving(true);
    try {
      await changeOwnPassword(newPassword);
      setSuccess("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="My profile" />

      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5">
          <div className="h-12 w-12 shrink-0 rounded-full bg-red-100" />
          <div>
            <p className="font-medium text-neutral-900">{currentUser?.name}</p>
            <p className="text-sm text-neutral-500">
              {currentUser?.role} · {currentUser?.username}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-center text-base font-medium text-neutral-900">
            Change password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-700">
                {success}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? "กำลังบันทึก..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
