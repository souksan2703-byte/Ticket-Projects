import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import AddTicketModal from "../components/AddTicketModal.jsx";
import { currency } from "../data/sampleData.js";
import { getTickets, createTicket, updateTicket, deleteTicket } from "../api.js";

export default function ManageTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null); // null = โหมดเพิ่มใหม่

  async function loadTickets() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function handleSave(formData) {
    if (editingTicket) {
      await updateTicket(editingTicket.id, formData);
    } else {
      await createTicket(formData);
    }
    setModalOpen(false);
    setEditingTicket(null);
    await loadTickets(); // โหลดใหม่ให้ตรงกับฐานข้อมูลเสมอ
  }

  async function handleDelete(id) {
    if (!confirm("ຕ້ອງການລຶບປີ້ນີ້ແທ້ບໍ?")) return;
    await deleteTicket(id);
    await loadTickets();
  }

  const openCount = tickets.filter((e) => e.status === "Open").length;

  return (
    <div>
      <PageHeader
        title="ຈັດການປີ້"
        action={
          <button
            onClick={() => {
              setEditingTicket(null);
              setModalOpen(true);
            }}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Add ticket
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard label="ປີ້ທັງໝົດ" value={tickets.length} className="bg-neutral-100 text-neutral-900" />
        <StatCard label="ພ້ອມຂາຍ" value={openCount} className="bg-neutral-100 text-green-700" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ: {error}
          <button onClick={loadTickets} className="ml-3 underline">
            ລອງໃໝ່
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-5 py-3 font-normal">ງານອີເວັນຕ໌</th>
              <th className="px-5 py-3 font-normal">ລາຄາ</th>
              <th className="px-5 py-3 font-normal">ຈຳນວນປີ້</th>
              <th className="px-5 py-3 font-normal">ວັນທີ ແລະ ເວລາ</th>
              <th className="px-5 py-3 font-normal">ສະຖານະ</th>
              <th className="px-5 py-3 font-normal">ແກ້ໄຂ</th>
              <th className="px-5 py-3 font-normal">ລຶບ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-neutral-400">
                  ກຳລັງໂຫຼດ...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-neutral-400">
                  ຍັງບໍ່ມີປີ້ ກົດ "ເພີ່ມປີ້" ເພື່ອເພີ່ມລາຍການທຳອິດ
                </td>
              </tr>
            ) : (
              tickets.map((e) => (
                <tr key={e.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-md bg-neutral-200" />
                      <div>
                        <p className="font-medium text-neutral-900">{e.name}</p>
                        <p className="text-xs text-neutral-500">{e.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-neutral-700">{currency(e.price)}</td>
                  <td className="px-5 py-4 text-neutral-700">{e.stock?.toLocaleString()}</td>
                  <td className="px-5 py-4 text-neutral-700">{e.date}</td>
                  <td className="px-5 py-4">
                    <StatusPill status={e.status} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => {
                        setEditingTicket(e);
                        setModalOpen(true);
                      }}
                      className="text-neutral-600 hover:text-neutral-900"
                    >
                      Edit
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <AddTicketModal
          initialData={editingTicket}
          onClose={() => {
            setModalOpen(false);
            setEditingTicket(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
