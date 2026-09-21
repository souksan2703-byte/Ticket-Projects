import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import EventCard from "../components/EventCard.jsx";
import { getEvents } from "../api.js";

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <section className="bg-gradient-to-br from-red-600 to-orange-500 px-4 py-16 text-center text-white sm:px-6">
        <h1 className="text-3xl font-bold sm:text-4xl">ຄອນເສີດແລະອີເວັ້ນຍອດນິຍົມ</h1>
        <p className="mt-3 text-red-50">ຈອງບັດງ່າຍໆ ຮິບ QR code ທັນທີບໍ່ຕ້ອງຕໍ່ຄິວ</p>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {loading ? (
          <p className="text-center text-neutral-400">ກຳລັງໂຫຼດ...</p>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ: {error}
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-neutral-400">ຍັງບໍ່ມີອີເວັນເປີດຂາຍໃນຕອນນີ້</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.tickid} event={e} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
