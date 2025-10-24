export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-6 text-sm border-b">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`pb-2 -mb-px ${active === t.id ? 'tab-active' : 'text-neutral-500 hover:text-brand-green'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}