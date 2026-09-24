import { useEffect, useRef, useState } from "react";
import { ScanLine, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { scanTicketCode } from "../api.js";
import { useLanguage } from "../i18n/LanguageContext";

// สีและไอคอนของแต่ละผลลัพธ์ที่เป็นไปได้จาก backend
const RESULT_STYLES = {
  success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", Icon: CheckCircle2 },
  not_sold: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", Icon: AlertTriangle },
  already_used: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", Icon: AlertTriangle },
  invalid: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", Icon: XCircle },
  error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", Icon: XCircle },
};

export default function ScanPage() {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  // โฟกัสช่อง input ค้างไว้เสมอ เพราะเครื่องสแกนภายนอกทำงานเหมือนคีย์บอร์ด
  // (พิมพ์โค้ดแล้วกด Enter ให้อัตโนมัติ) ต้องมี focus อยู่ที่ช่องนี้ตลอดเวลาถึงจะรับค่าได้
  useEffect(() => {
    inputRef.current?.focus();
    const refocus = () => inputRef.current?.focus();
    window.addEventListener("click", refocus);
    return () => window.removeEventListener("click", refocus);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const code = input.trim();
    if (!code || scanning) return;

    setScanning(true);
    setInput("");
    try {
      const data = await scanTicketCode(code);
      setLastResult({ ...data, scannedCode: code, timestamp: new Date() });
      setHistory((h) => [{ ...data, scannedCode: code, timestamp: new Date() }, ...h].slice(0, 10));
    } catch (err) {
      const errData = { result: "error", message: err.message, scannedCode: code, timestamp: new Date() };
      setLastResult(errData);
      setHistory((h) => [errData, ...h].slice(0, 10));
    } finally {
      setScanning(false);
      inputRef.current?.focus();
    }
  }

  const style = lastResult ? RESULT_STYLES[lastResult.result] || RESULT_STYLES.error : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2.5">
        <ScanLine className="h-6 w-6 text-neutral-700" />
        <h1 className="text-xl font-semibold text-neutral-900">{t("scanTicket")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-neutral-200 bg-white p-6">
        <label className="mb-2 block text-sm text-neutral-700">
          {t("readyToScan")}
        </label>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          disabled={scanning}
          className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 text-lg font-mono outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          placeholder={t("waitingForScanner")}
        />
        <p className="mt-2 text-xs text-neutral-400">
          {t("scanFocusHint")}
        </p>
      </form>

      {lastResult && (
        <div className={`mb-6 rounded-xl border p-6 ${style.bg} ${style.border}`}>
          <div className="flex items-start gap-3">
            <style.Icon className={`h-8 w-8 shrink-0 ${style.text}`} />
            <div className="flex-1">
              <p className={`text-lg font-semibold ${style.text}`}>{lastResult.message}</p>
              <p className="mt-1 font-mono text-sm text-neutral-500">{t("codeColon")} {lastResult.scannedCode}</p>
              {lastResult.ticket?.owner && (
                <p className="text-sm text-neutral-500">{t("ticketOwnerColon")} {lastResult.ticket.owner}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-neutral-700">{t("recentScanHistory")}</h2>
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <tbody>
                {history.map((h, i) => {
                  const s = RESULT_STYLES[h.result] || RESULT_STYLES.error;
                  return (
                    <tr key={i} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-3">
                        <s.Icon className={`h-4 w-4 ${s.text}`} />
                      </td>
                      <td className="px-4 py-3 font-mono text-neutral-900">{h.scannedCode}</td>
                      <td className="px-4 py-3 text-neutral-600">{h.message}</td>
                      <td className="px-4 py-3 text-right text-xs text-neutral-400">
                        {h.timestamp.toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
