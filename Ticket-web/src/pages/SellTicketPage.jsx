import { useEffect, useState } from "react";
import { ShoppingCart, Download } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { getTickets, sellTicketCode, getQrCodeUrl } from "../api.js";
import { useLanguage } from "../i18n/LanguageContext";

function currency(n) {
  return `${Number(n || 0).toLocaleString()} LAK`;
}

export default function SellTicketPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [tickid, setTickid] = useState("");
  const [owner, setOwner] = useState("");
  const [tranid, setTranid] = useState("");
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [error, setError] = useState(null);
  const [sold, setSold] = useState(null); // ผลลัพธ์การขายล่าสุด (โค้ด + QR)

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await getTickets();
      // แสดงเฉพาะอีเวนต์ที่เปิดขายอยู่ (Open) เท่านั้น
      const openEvents = data.filter((e) => e.status === "Open");
      setEvents(openEvents);
      if (openEvents[0]) setTickid(openEvents[0].id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const selectedEvent = events.find((e) => String(e.id) === String(tickid));

  async function handleSell(e) {
    e.preventDefault();
    setError(null);

    if (!tickid || !owner.trim()) {
      setError(t("selectEventAndBuyer"));
      return;
    }

    setSelling(true);
    try {
      const result = await sellTicketCode({ tickid, owner: owner.trim(), tranid: tranid.trim() || undefined });
      setSold(result);
      setOwner("");
      setTranid("");
      await loadEvents(); // รีเฟรช stock ที่เหลือให้ตรง
    } catch (err) {
      setError(err.message || t("sellFailed"));
    } finally {
      setSelling(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("sellTicket")} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <div className="max-h-[75vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-medium text-neutral-900">
            <ShoppingCart className="h-4 w-4" />
            {t("sellNewTicket")}
          </h2>

          {loading ? (
            <p className="text-sm text-neutral-400">{t("loadingEvents")}</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-neutral-400">{t("noEventsOpenForSale")}</p>
          ) : (
            <form onSubmit={handleSell} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">{t("eventLabel")}</label>
                <select
                  value={tickid}
                  onChange={(e) => setTickid(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} — {t("stockLeftSuffix")} {e.stock}
                    </option>
                  ))}
                </select>
                {selectedEvent && (
                  <p className="mt-1.5 text-xs text-neutral-500">
                    {t("priceLabel")} {currency(selectedEvent.price)} · {t("stockLeftSuffix")} {selectedEvent.stock}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">
                  {t("buyerNamePhone")}
                </label>
                <input
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. 0201234567"
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-neutral-700">
                  {t("transactionIdOptional")}
                </label>
                <input
                  value={tranid}
                  onChange={(e) => setTranid(e.target.value)}
                  placeholder="e.g. TXN-20260904-1234"
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <button
                type="submit"
                disabled={selling || !selectedEvent?.stock}
                className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {selling
                  ? t("processing")
                  : !selectedEvent?.stock
                  ? t("soldOut")
                  : t("confirmSale")}
              </button>
            </form>
          )}
        </div>

        <div className="max-h-[75vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-base font-medium text-neutral-900">{t("latestSaleResult")}</h2>

          {!sold ? (
            <p className="text-sm text-neutral-400">
              {t("noSaleYet")}
            </p>
          ) : (
            <div className="text-center">
              <img
                src={getQrCodeUrl(sold.code)}
                alt={`QR code สำหรับ ${sold.code}`}
                className="mx-auto mb-4 h-48 w-48 rounded-lg border border-neutral-200"
              />
              <p className="mb-1 font-mono text-lg font-semibold text-neutral-900">{sold.code}</p>
              <p className="mb-4 text-sm text-neutral-500">
                {sold.eventName} · {currency(sold.price)}
              </p>
              <div className="mb-4 rounded-lg bg-neutral-50 p-3 text-left text-sm text-neutral-600">
                <p>{t("buyerColon")} {sold.owner}</p>
                <p>Transaction ID: {sold.tranid}</p>
              </div>
              <a
                href={getQrCodeUrl(sold.code)}
                download={`${sold.code}.png`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Download className="h-4 w-4" />
                {t("downloadQrForCustomer")}
              </a>
              <p className="mt-4 text-xs text-neutral-400">
                {t("qrHandoffNote")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}