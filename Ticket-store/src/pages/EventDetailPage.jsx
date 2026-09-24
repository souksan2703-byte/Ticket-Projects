import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Calendar, MapPin, Minus, Plus, ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { getEvent, getImageUrl } from "../api.js";
import { useCart } from "../context/CartContext.jsx";

function currency(n) {
  return `${Number(n || 0).toLocaleString()} LAK`;
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setLoading(true);
    getEvent(id)
      .then(setEvent)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function handleAddToCart() {
    addItem(event, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    addItem(event, quantity);
    navigate("/cart");
  }

  const imageUrl = event ? getImageUrl(event.Logo) : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800">
          <ArrowLeft className="h-4 w-4" />
          ກັບໄປຫຼັງ
        </Link>

        {loading ? (
          <p className="text-center text-neutral-400">ກຳລັງໂຫຼດ...</p>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={event.Title}
                className="h-56 w-full object-cover sm:h-72"
              />
            ) : (
              <div className="flex h-56 items-center justify-center bg-gradient-to-br from-red-500 to-orange-400 text-white sm:h-72">
                <span className="px-6 text-center text-2xl font-bold sm:text-3xl">{event.Title}</span>
              </div>
            )}

            <div className="space-y-6 p-6 sm:p-8">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">{event.Title}</h1>
                {event.Description && <p className="mt-2 text-neutral-600">{event.Description}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-xl bg-neutral-50 p-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-xs text-neutral-500">ວັນແລະເວລາ</p>
                    <p className="font-medium text-neutral-900">{event.DateEvent || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-xs text-neutral-500">ສະຖານທີ່</p>
                    <p className="font-medium text-neutral-900">{event.Location || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-100 pt-6">
                <div>
                  <p className="text-xs text-neutral-500">ລາຄາໃບ</p>
                  <p className="text-2xl font-bold text-red-600">{currency(event.Price)}</p>
                  <p className="mt-1 text-xs text-neutral-400">ເຫຼືອ {event.Stock} ໃບ</p>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-neutral-200 px-2 py-1.5">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="rounded p-1.5 hover:bg-neutral-100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(event.Stock, q + 1))}
                    className="rounded p-1.5 hover:bg-neutral-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleAddToCart}
                  disabled={event.Stock < 1}
                  className="flex-1 rounded-lg border border-red-600 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {added ? "ເພີ່ມລົງໃນກະຕ່າແລ້ວ ✓" : "ເພີ່ມລົງໃນກະຕ່າ"}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={event.Stock < 1}
                  className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {event.Stock < 1 ? "ປີ້ຫຼາຍ" : "ຊື້ທັນທີ"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}