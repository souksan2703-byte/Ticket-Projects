const STYLES = {
  Open: "bg-green-100 text-green-700",
  OFF: "bg-red-100 text-red-600",
  Sold: "bg-green-100 text-green-700",
  Available: "bg-red-100 text-red-600",
  Used: "bg-indigo-100 text-indigo-700",
  Active: "bg-green-100 text-green-700",
  Disabled: "bg-red-100 text-red-600",
  Admin: "bg-red-50 text-red-600",
  User: "bg-neutral-100 text-neutral-600",
  Success: "bg-green-100 text-green-700",
};

export default function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
        STYLES[status] || "bg-neutral-100 text-neutral-600"
      }`}
    >
      {status}
    </span>
  );
}
