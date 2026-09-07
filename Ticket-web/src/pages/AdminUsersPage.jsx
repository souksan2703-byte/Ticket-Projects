import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import StatusPill from "../components/StatusPill.jsx";
import AddAdminUserModal from "../components/AddAdminUserModal.jsx";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  toggleAdminUserStatus,
} from "../api.js";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSave(formData) {
    if (editingUser) {
      await updateAdminUser(editingUser.id, { name: formData.name, role: formData.role });
    } else {
      await createAdminUser(formData);
    }
    setModalOpen(false);
    setEditingUser(null);
    await loadUsers();
  }

  async function handleReset(user) {
    const newPassword = prompt(`ตั้งรหัสผ่านใหม่สำหรับ "${user.username}"`);
    if (!newPassword) return; // กดยกเลิกหรือเว้นว่างไว้
    try {
      await resetAdminUserPassword(user.id, newPassword);
      alert("รีเซ็ตรหัสผ่านเรียบร้อยแล้ว");
    } catch (err) {
      alert(`รีเซ็ตรหัสผ่านไม่สำเร็จ: ${err.message}`);
    }
  }

  async function handleToggleStatus(user) {
    const nextStatus = user.status === "Active" ? "Disabled" : "Active";
    try {
      await toggleAdminUserStatus(user.id, nextStatus);
      await loadUsers();
    } catch (err) {
      alert(`เปลี่ยนสถานะไม่สำเร็จ: ${err.message}`);
    }
  }

  return (
    <div>
      <PageHeader
        title="Admin users"
        action={
          <button
            onClick={() => {
              setEditingUser(null);
              setModalOpen(true);
            }}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Add admin user
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          โหลดข้อมูลไม่สำเร็จ: {error}
          <button onClick={loadUsers} className="ml-3 underline">
            ลองใหม่
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-5 py-3 font-normal">Name</th>
              <th className="px-5 py-3 font-normal">Username</th>
              <th className="px-5 py-3 font-normal">Role</th>
              <th className="px-5 py-3 font-normal">Status</th>
              <th className="px-5 py-3 font-normal">Last login</th>
              <th className="px-5 py-3 font-normal">Edit</th>
              <th className="px-5 py-3 font-normal">Reset PW</th>
              <th className="px-5 py-3 font-normal">Enable/Disable</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-neutral-400">
                  กำลังโหลด...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-neutral-400">
                  ยังไม่มีผู้ใช้ กด "Add admin user" เพื่อเพิ่มรายการแรก
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-5 py-4 font-medium text-neutral-900">{u.name}</td>
                  <td className="px-5 py-4 text-neutral-700">{u.username}</td>
                  <td className="px-5 py-4">
                    <StatusPill status={u.role} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={u.status} />
                  </td>
                  <td className="px-5 py-4 text-neutral-700">{u.last || "-"}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setModalOpen(true);
                      }}
                      className="text-neutral-600 hover:text-neutral-900"
                    >
                      Edit
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleReset(u)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Reset
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={
                        u.status === "Active"
                          ? "text-red-600 hover:text-red-700"
                          : "text-green-700 hover:text-green-800"
                      }
                    >
                      {u.status === "Active" ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <AddAdminUserModal
          initialData={editingUser}
          onClose={() => {
            setModalOpen(false);
            setEditingUser(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
