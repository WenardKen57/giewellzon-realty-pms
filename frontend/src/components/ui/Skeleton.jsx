export default function Skeleton({ lines=3 }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({length:lines}).map((_,i)=>(
        <div key={i} className="h-3 rounded bg-neutral-200" />
      ))}
    </div>
  );
}