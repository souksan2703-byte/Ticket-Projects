export default function PageHeader({ title, action }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
      {action}
    </div>
  );
}
