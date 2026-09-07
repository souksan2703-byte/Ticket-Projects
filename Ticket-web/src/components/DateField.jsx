import { Calendar } from "lucide-react";

export default function DateField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-neutral-600">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700">
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-transparent outline-none"
        />
        <Calendar className="ml-auto h-4 w-4 shrink-0 text-neutral-400" />
      </div>
    </div>
  );
}
