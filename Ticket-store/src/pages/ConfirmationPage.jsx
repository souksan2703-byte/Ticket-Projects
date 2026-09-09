import { useLocation, Navigate, Link } from "react-router-dom";
import { CheckCircle2, Calendar, MapPin, Download } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { getQrCodeUrl } from "../api.js";

function currency(n) {
  return `${Number(n || 0).toLocaleString()} LAK`;
}

export default function ConfirmationPage() {
  const location = useLocation();
  const result = location.state;

  // ถ้าเข้าหน้านี้ตรงๆ โดยไม่ได้ผ่านการชำระเงิน (ไม่มีข้อมูล state ส่งมา) ให้เด้งกลับหน้าแรก
  if (!result) {
    return <Navigate to="/" replace />;
  }

  const { tranid, buyerName, buyerPhone, tickets } = result;
  const total = tickets.reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-green-500" />
          <h1 className="text-2xl font-bold text-neutral-900">ชำระเงินสำเร็จ!</h1>
          <p className="mt-1 text-neutral-500">
            เลขที่คำสั่งซื้อ: <span className="font-mono font-medium">{tranid}</span>
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-base font-medium text-neutral-900">ข้อมูลผู้ซื้อ</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-400">ชื่อ</p>
              <p className="font-medium text-neutral-900">{buyerName}</p>
            </div>
            <div>
              <p className="text-neutral-400">เบอร์โทร</p>
              <p className="font-medium text-neutral-900">{buyerPhone}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          {tickets.map((t, i) => (
            <div key={t.code} className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-400">ตั๋วใบที่ {i + 1}</span>
                <span className="font-semibold text-red-600">{currency(t.price)}</span>
              </div>

              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <img
                  src={getQrCodeUrl(t.code)}
                  alt={`QR code สำหรับ ${t.code}`}
                  className="h-40 w-40 shrink-0 rounded-lg border border-neutral-200"
                />

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-neutral-900">{t.eventName}</h3>
                  <p className="flex items-center justify-center gap-1.5 text-sm text-neutral-600 sm:justify-start">
                    <Calendar className="h-4 w-4 text-red-600" />
                    {t.dateEvent || "-"}
                  </p>
                  <p className="flex items-center justify-center gap-1.5 text-sm text-neutral-600 sm:justify-start">
                    <MapPin className="h-4 w-4 text-red-600" />
                    {t.location || "-"}
                  </p>
                  <p className="pt-1 font-mono text-sm text-neutral-500">โค้ด: {t.code}</p>

                  <a
                    href={getQrCodeUrl(t.code)}
                    download={`${t.code}.png`}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    ดาวน์โหลด QR
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex justify-between text-lg font-bold text-neutral-900">
            <span>ยอดชำระทั้งหมด</span>
            <span className="text-red-600">{currency(total)}</span>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          กรุณาเก็บ QR code หรือโค้ดตั๋วนี้ไว้ แล้วนำมาแสดงตอนเข้างานเพื่อรับบัตร/สแกนเข้างาน
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-medium text-red-600 hover:underline">
            กลับไปหน้าหลัก
          </Link>
        </div>
      </main>
    </div>
  );
}
