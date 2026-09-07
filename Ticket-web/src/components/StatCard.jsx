export default function StatCard({ label, value, className = "" }) {
  return (
    <div className={`rounded-xl p-5 ${className}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
