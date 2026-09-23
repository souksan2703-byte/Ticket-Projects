import { useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export default function GenerateCodesModal({ events, onClose, onGenerate }) {
  const { t } = useLanguage();
  const [tickid, setTickid] = useState(events[0]?.id || "");
  const [quantity, setQuantity] = useState(10);
  const [prefix, setPrefix] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!tickid) {
      setError(t("pleaseSelectEvent"));
      return;
    }
    if (!quantity || quantity < 1) {
      setError(t("pleaseSpecifyQuantity"));
      return;
    }

    setSaving(true);
    try {
      await onGenerate({ tickid, quantity: Number(quantity), prefix });
    } catch (err) {
      setError(err.message || t("generateFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">{t("generateTicketCodes")}</h2>
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
              <label className="mb-1.5 block text-sm text-neutral-700">{t("colEvent")}</label>
              <select
                value={tickid}
                onChange={(e) => setTickid(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">{t("quantity")}</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">
                {t("codePrefixOptional")}
              </label>
              <input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="e.g. LWS1"
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
              <p className="mt-1 text-xs text-neutral-400">
                {t("codeFormatHint").replace("{prefix}", prefix || "TIX")}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? t("generatingEllipsis") : t("generate")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
