import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../context/CartContext.jsx";

function currency(n) {
  return `${Number(n || 0).toLocaleString()} LAK`;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, totalQuantity } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800">
          <ArrowLeft className="h-4 w-4" />
          ເລືອກຊື້ເພິ່ມ
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-neutral-900">ກະຕ່າສິນຄ້າ</h1>

        {items.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-neutral-400">
            ກະຕ່າສິນຄ້າຂອງທ່ານຍັງຫວ່າງ
            <div className="mt-4">
              <Link to="/" className="text-sm font-medium text-red-600 hover:underline">
                ໄປເລືອກຄອນເສີດ
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.tickid}
                className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-neutral-900">{item.name}</p>
                  <p className="text-sm text-neutral-500">{item.location}</p>
                  <p className="text-sm text-neutral-500">{item.dateEvent}</p>
                  <p className="mt-1 font-semibold text-red-600">{currency(item.price)}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 rounded-lg border border-neutral-200 px-2 py-1.5">
                    <button
                      onClick={() => updateQuantity(item.tickid, item.quantity - 1)}
                      className="rounded p-1 hover:bg-neutral-100"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.tickid, Math.min(item.maxStock, item.quantity + 1))
                      }
                      className="rounded p-1 hover:bg-neutral-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.tickid)}
                    className="rounded p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between text-sm text-neutral-600">
                <span>ຈຳນວນປີ້ທັ່ງໝົດ</span>
                <span>{totalQuantity}  ໃບ</span>
              </div>
              <div className="mb-5 flex items-center justify-between text-lg font-bold text-neutral-900">
                <span>ຍອດລວມ</span>
                <span className="text-red-600">{currency(totalPrice)}</span>
              </div>
              <button
                onClick={() => navigate("/checkout")}
                className="w-full rounded-lg bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700"
              >
                ດຳເນີນການຊຳລະເງິນ
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
