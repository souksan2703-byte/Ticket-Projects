import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import DateField from "../components/DateField.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { getReportSummary, getRevenueByEvent, getReportTransactions } from "../api.js";

function currency(n) {
  return `${Number(n || 0).toLocaleString()} LAK`;
}

// สร้างไฟล์ CSV จากข้อมูลที่โหลดมาแล้วในเบราว์เซอร์ ไม่ต้องมี endpoint แยกฝั่ง backend
function downloadCsv(rows) {
  const header = ["Code", "Event", "Owner", "Transaction ID", "Price"];
  const lines = rows.map((r) => [r.code, r.eventName, r.owner, r.tranid, r.price].join(","));
  const csv = [header.join(","), ...lines].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState({ totalRevenue: 0, totalBuyers: 0, ticketsSold: 0, bestSellingEvent: "-" });
  const [revenueByEvent, setRevenueByEvent] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadReport() {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, revenueData, txData] = await Promise.all([
        getReportSummary(from, to),
        getRevenueByEvent(from, to),
        getReportTransactions(from, to),
      ]);
      setSummary(summaryData);
      setRevenueByEvent(revenueData);
      setTransactions(txData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const maxRevenue = Math.max(1, ...revenueByEvent.map((r) => r.revenue));

  return (
    <div>
      <PageHeader title="Reports" />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-2">
        <DateField label="Transaction date" value={from} onChange={setFrom} />
        <DateField label="To date" value={to} onChange={setTo} />
      </div>

      <button
        onClick={() => downloadCsv(transactions)}
        disabled={transactions.length === 0}
        className="mb-6 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </button>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          โหลดข้อมูลไม่สำเร็จ: {error}
          <button onClick={loadReport} className="ml-3 underline">
            ลองใหม่
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total revenue" value={currency(summary.totalRevenue)} className="bg-neutral-100 text-neutral-900" />
        <StatCard label="Total buyers" value={summary.totalBuyers.toLocaleString()} className="bg-neutral-100 text-neutral-900" />
        <StatCard label="Tickets sold" value={summary.ticketsSold.toLocaleString()} className="bg-neutral-100 text-neutral-900" />
        <StatCard label="Best-selling event" value={summary.bestSellingEvent} className="bg-neutral-100 text-neutral-900" />
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5">
        <p className="mb-5 text-sm font-medium text-neutral-800">Revenue by event</p>
        {revenueByEvent.length === 0 ? (
          <p className="text-sm text-neutral-400">ยังไม่มีข้อมูลยอดขายในช่วงเวลานี้</p>
        ) : (
          <div className="space-y-4">
            {revenueByEvent.map((r) => (
              <div key={r.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-neutral-700">{r.name}</span>
                  <span className="text-neutral-500">{currency(r.revenue)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-red-100">
                  <div
                    className="h-2 rounded-full bg-amber-500"
                    style={{ width: `${(r.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-5 py-3 font-normal">Code</th>
              <th className="px-5 py-3 font-normal">Event</th>
              <th className="px-5 py-3 font-normal">Owner</th>
              <th className="px-5 py-3 font-normal">Transaction ID</th>
              <th className="px-5 py-3 font-normal">Price</th>
              <th className="px-5 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-neutral-400">
                  กำลังโหลด...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-neutral-400">
                  ยังไม่มีรายการขายในช่วงเวลานี้
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.code} className="border-b border-neutral-100 last:border-0">
                  <td className="px-5 py-4 font-medium text-neutral-900">{t.code}</td>
                  <td className="px-5 py-4 text-neutral-700">{t.eventName}</td>
                  <td className="px-5 py-4 text-neutral-700">{t.owner || "-"}</td>
                  <td className="px-5 py-4 text-neutral-700">{t.tranid || "-"}</td>
                  <td className="px-5 py-4 text-neutral-700">{currency(t.price)}</td>
                  <td className="px-5 py-4">
                    <StatusPill status="Success" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
