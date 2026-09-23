import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import PageHeader from "../components/PageHeader.jsx";
import DateField from "../components/DateField.jsx";
import StatCard from "../components/StatCard.jsx";
import { useLanguage } from "../i18n/LanguageContext";
import {
  getDashboardSummary,
  getDashboardSoldByEvent,
  getDashboardTicketMix,
  getDashboardTransactions,
} from "../api.js";

function currency(n) {
  return `${Number(n || 0).toLocaleString()} LAK`;
}

const BAR_COLORS = ["#DC2626", "#F59E0B", "#7C2D12", "#D1D5DB", "#059669", "#9333EA"];
const LINE_COLORS = ["#F97316", "#2563EB"];

export default function DashboardPage() {
  const { t } = useLanguage();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [summary, setSummary] = useState({ todaysSales: 0, ticketsSoldThisMonth: 0, active: 0, off: 0 });
  const [soldByEvent, setSoldByEvent] = useState([]);
  const [ticketMix, setTicketMix] = useState([]);
  const [txData, setTxData] = useState({ events: [], series: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, soldData, mixData, txSeries] = await Promise.all([
        getDashboardSummary(),
        getDashboardSoldByEvent(from, to),
        getDashboardTicketMix(from, to),
        getDashboardTransactions(from, to),
      ]);
      setSummary(summaryData);
      setSoldByEvent(soldData);
      setTicketMix(mixData);
      setTxData(txSeries);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const totalSold = soldByEvent.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div>
      <PageHeader title={t("dashboard")} />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2">
        <DateField label={t("transactionDate")} value={from} onChange={setFrom} />
        <DateField label={t("toDate")} value={to} onChange={setTo} />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("loadFailed")}: {error}
          <button onClick={loadAll} className="ml-3 underline">
            {t("retry")}
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label={t("todaysSales")}
          value={currency(summary.todaysSales)}
          className="bg-gradient-to-br from-violet-200 to-violet-300 text-violet-900"
        />
        <StatCard
          label={t("ticketsSoldThisMonth")}
          value={summary.ticketsSoldThisMonth.toLocaleString()}
          className="bg-cyan-200 text-cyan-900"
        />
        <StatCard label={t("active")} value={summary.active} className="bg-lime-200 text-lime-900" />
        <StatCard label={t("off")} value={summary.off} className="bg-red-200 text-red-900" />
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-5">
        <p className="mb-4 text-sm font-medium text-neutral-800">
          {t("ticketsSoldByEvent")} ({totalSold === 1 && soldByEvent.length === 0 ? 0 : totalSold} {t("total")})
        </p>
        {soldByEvent.length === 0 ? (
          <p className="text-sm text-neutral-400">{t("noSalesDataInRange")}</p>
        ) : (
          <>
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              {soldByEvent.map((s, i) => (
                <div
                  key={s.name}
                  style={{ width: `${(s.value / totalSold) * 100}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600">
              {soldByEvent.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                  {s.name} · {s.value} ({Math.round((s.value / totalSold) * 100)}%)
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="mb-4 text-sm font-medium text-neutral-800">{t("ticketMixTop2")}</p>
          {ticketMix.length === 0 ? (
            <p className="text-sm text-neutral-400">{t("noDataYet")}</p>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={ticketMix} dataKey="value" nameKey="name" innerRadius={0} outerRadius={90}>
                    {ticketMix.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <p className="mb-4 text-sm font-medium text-neutral-800">{t("transactionDaily")}</p>
          {txData.series.length === 0 ? (
            <p className="text-sm text-neutral-400">{t("noDataYet")}</p>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={txData.series} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F1EF" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                    width={45}
                  />
                  <Tooltip formatter={(v) => currency(v)} />
                  <Legend />
                  {txData.events.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      name={name}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
