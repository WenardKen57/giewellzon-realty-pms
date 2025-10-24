export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="card">
      <div className="text-xs tracking-wide uppercase text-neutral-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-neutral-500">{subtitle}</div>}
    </div>
  );
}