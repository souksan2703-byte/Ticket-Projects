import { useEffect, useState } from "react";
import { Search, QrCode } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import GenerateCodesModal from "../components/GenerateCodesModal.jsx";
import QrCodeModal from "../components/QrCodeModal.jsx";
import { getTickets, getTicketCodes, getTicketCodeStats, generateTicketCodes, markTicketCodeReceived } from "../api.js";
import { useLanguage } from "../i18n/LanguageContext";

export default function TicketCodesPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [codes, setCodes] = useState([]);
  const [stats, setStats] = useState({ total: 0, sold: 0, remaining: 0, received: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState(null); // โค้ดที่กำลังเปิดดู QR อยู่ (null = ไม่ได้เปิด modal)

  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  async function loadEvents() {
    try {
      const data = await getTickets();
      setEvents(data);
    } catch {
      // ถ้าโหลด events ບໍ່ສຳເລັດ ยังใช้หน้านี้ต่อได้ แค่ dropdown จะว่าง
    }
  }

  async function loadCodes() {
    setLoading(true);
    setError(null);
    try {
      const filters = { tickid: eventFilter || undefined, status: statusFilter, search: search || undefined };
      const [codesData, statsData] = await Promise.all([
        getTicketCodes(filters),
        getTicketCodeStats(eventFilter || undefined),
      ]);
      setCodes(codesData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventFilter, statusFilter]);

  // ค้นหาแบบ debounce เล็กน้อย กันยิง request รัวทุกตัวอักษรที่พิมพ์
  useEffect(() => {
    const timer = setTimeout(() => loadCodes(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleGenerate(payload) {
    await generateTicketCodes(payload);
    setModalOpen(false);
    await loadCodes();
  }

  async function handleMarkReceived(code) {
    const msg = t("confirmMarkReceived").replace("{name}", code.owner || code.code);
    if (!confirm(msg)) return;
    try {
      await markTicketCodeReceived(code.id);
      await loadCodes();
    } catch (err) {
      alert(`${t("saveFailed")}: ${err.message}`);
    }
  }

  return (
    <div>
      <PageHeader
        title={t("ticketCodes")}
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            {t("generateCodes")}
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-700 outline-none"
        >
          <option value="">{t("filterAllEvents")}</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-700 outline-none"
        >
          <option value="All">{t("filterStatusAll")}</option>
          <option value="Sold">{t("statusSold")}</option>
          <option value="Available">{t("statusAvailable")}</option>
          <option value="Used">{t("statusUsed")}</option>
        </select>
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5">
          <Search className="h-4 w-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm text-neutral-700 outline-none placeholder:text-neutral-400"
            placeholder={t("searchOwnerTranId")}
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label={t("totalCodes")} value={stats.total} className="bg-neutral-100 text-neutral-900" />
        <StatCard label={t("statusSold")} value={stats.sold} className="bg-neutral-100 text-red-600" />
        <StatCard label={t("remaining")} value={stats.remaining} className="bg-neutral-100 text-green-700" />
        <StatCard label={t("receivedPickedUp")} value={stats.received} className="bg-neutral-100 text-amber-700" />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("loadFailed")}: {error}
          <button onClick={loadCodes} className="ml-3 underline">
            {t("retry")}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-5 py-3 font-normal">{t("colCode")}</th>
              <th className="px-5 py-3 font-normal">{t("colEvent")}</th>
              <th className="px-5 py-3 font-normal">{t("colOwner")}</th>
              <th className="px-5 py-3 font-normal">{t("colTransactionId")}</th>
              <th className="px-5 py-3 font-normal">{t("colTicketReceived")}</th>
              <th className="px-5 py-3 font-normal">{t("colStatus")}</th>
              <th className="px-5 py-3 font-normal">{t("colQr")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-neutral-400">
                  {t("loadingEllipsis")}
                </td>
              </tr>
            ) : codes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-neutral-400">
                  {t("noCodesYet").replace("{generateCodes}", t("generateCodes"))}
                </td>
              </tr>
            ) : (
              codes.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-5 py-4 font-medium text-neutral-900">{c.code}</td>
                  <td className="px-5 py-4 text-neutral-700">{c.eventName}</td>
                  <td className="px-5 py-4 text-neutral-700">{c.owner || "-"}</td>
                  <td className="px-5 py-4 text-neutral-700">{c.tranid || "-"}</td>
                  <td className="px-5 py-4 text-neutral-700">
                    {c.status === "Sold" ? (
                      <button
                        onClick={() => handleMarkReceived(c)}
                        className="text-red-600 underline hover:text-red-700"
                      >
                        {c.received}
                      </button>
                    ) : (
                      c.received
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setQrCode(c.code)}
                      className="text-neutral-600 hover:text-neutral-900"
                      title={t("viewDownloadQr")}
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <GenerateCodesModal
          events={events}
          onClose={() => setModalOpen(false)}
          onGenerate={handleGenerate}
        />
      )}

      {qrCode && <QrCodeModal code={qrCode} onClose={() => setQrCode(null)} />}
    </div>
  );
}
