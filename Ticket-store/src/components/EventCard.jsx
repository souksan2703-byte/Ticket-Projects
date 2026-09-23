import { Link } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";
import { getImageUrl } from "../api.js";

function currency(n) {
  return `${Number(n || 0).toLocaleString()} LAK`;
}

export default function EventCard({ event }) {
  const imageUrl = getImageUrl(event.Logo);

  return (
    <Link
      to={`/event/${event.tickid}`}
      className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={event.Title}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-red-500 to-orange-400 text-white">
          <span className="px-4 text-center text-lg font-semibold">{event.Title}</span>
        </div>
      )}
      <div className="space-y-2 p-5">
        <h3 className="line-clamp-1 text-base font-semibold text-neutral-900">{event.Title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-neutral-500">
          <Calendar className="h-3.5 w-3.5" />
          {event.DateEvent || "-"}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-neutral-500">
          <MapPin className="h-3.5 w-3.5" />
          {event.Location || "-"}
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-red-600">{currency(event.Price)}</span>
          <span className="text-xs text-neutral-400">เหลือ {event.Stock} ใบ</span>
        </div>
      </div>
    </Link>
  );
}