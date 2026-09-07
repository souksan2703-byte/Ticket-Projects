import { X, Download } from "lucide-react";
import { getQrCodeUrl } from "../api.js";

export default function QrCodeModal({ code, onClose }) {
  const qrUrl = getQrCodeUrl(code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">QR code</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <img
          src={qrUrl}
          alt={`QR code สำหรับ ${code}`}
          className="mx-auto mb-4 h-56 w-56 rounded-lg border border-neutral-200"
        />
        <p className="mb-6 font-mono text-sm text-neutral-600">{code}</p>

        <a
          href={qrUrl}
          download={`${code}.png`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
        >
          <Download className="h-4 w-4" />
          ดาวน์โหลด QR
        </a>
      </div>
    </div>
  );
}
