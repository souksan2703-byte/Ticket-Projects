import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Lock, CreditCard } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../context/CartContext.jsx";
import { checkout } from "../api.js";

function currency(n) {
  return `${Number(n || 0).toLocaleString()} LAK`;
}

export default function CheckoutPage() {
  const { items, totalPrice, totalQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center text-neutral-400 sm:px-6">
          ตะกร้าว่างเปล่า —{" "}
          <Link to="/" className="font-medium text-red-600 hover:underline">
            ไปเลือกคอนเสิร์ต
          </Link>
        </main>
      </div>
    );
  }

  async function handlePay(e) {
    e.preventDefault();
    setError(null);

    if (!buyerName.trim() || !buyerPhone.trim()) {
      setError("กรุณากรอกชื่อและเบอร์โทรผู้ซื้อ");
      return;
    }
    if (!cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
      setError("กรุณากรอกข้อมูลบัตรให้ครบ (จำลองการชำระเงินเท่านั้น ไม่มีการตัดเงินจริง)");
      return;
    }

    setPaying(true);
    try {
      const payload = {
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        items: items.map((i) => ({ tickid: i.tickid, quantity: i.quantity })),
      };
      const result = await checkout(payload);
      clearCart();
      navigate("/confirmation", { state: result });
    } catch (err) {
      setError(err.message || "ชำระเงินไม่สำเร็จ");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link to="/cart" className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800">
          <ArrowLeft className="h-4 w-4" />
          กลับไปตะกร้า
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-neutral-900">ชำระเงิน</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form onSubmit={handlePay} className="space-y-6 lg:col-span-2">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 text-base font-medium text-neutral-900">ข้อมูลผู้ซื้อ</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-neutral-700">ชื่อ-นามสกุล</label>
                  <input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    placeholder="สมชาย ใจดี"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-neutral-700">เบอร์โทร</label>
                  <input
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    placeholder="020xxxxxxx"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h2 className="mb-1 flex items-center gap-2 text-base font-medium text-neutral-900">
                <CreditCard className="h-4 w-4" />
                ข้อมูลบัตร
              </h2>
              <p className="mb-4 flex items-center gap-1.5 text-xs text-neutral-400">
                <Lock className="h-3 w-3" />
                นี่คือฟอร์มจำลอง ไม่มีการเชื่อมต่อระบบชำระเงินจริงหรือตัดเงินจริง
              </p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-neutral-700">หมายเลขบัตร</label>
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength={19}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    placeholder="4111 1111 1111 1111"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm text-neutral-700">วันหมดอายุ</label>
                    <input
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-neutral-700">CVV</label>
                    <input
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      maxLength={4}
                      className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={paying}
              className="w-full rounded-lg bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {paying ? "กำลังดำเนินการชำระเงิน..." : `ชำระเงิน ${currency(totalPrice)}`}
            </button>
          </form>

          <div className="h-fit rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-base font-medium text-neutral-900">สรุปคำสั่งซื้อ</h2>
            <div className="space-y-3 border-b border-neutral-100 pb-4 text-sm">
              {items.map((i) => (
                <div key={i.tickid} className="flex justify-between text-neutral-600">
                  <span>
                    {i.name} × {i.quantity}
                  </span>
                  <span>{currency(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between font-semibold text-neutral-900">
              <span>รวม ({totalQuantity} ใบ)</span>
              <span className="text-red-600">{currency(totalPrice)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
