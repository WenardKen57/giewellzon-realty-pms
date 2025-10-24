import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../../api/analytics";

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    AnalyticsAPI.dashboard().then(setData).catch(console.error);
  }, []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
      <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
        {/* This label is updated for clarity */}
        <Kpi title="Total Buildings" value={data?.propertyCount ?? 0} />

        <Kpi title="Pending Inquiries" value={data?.pendingInquiries ?? 0} />
        <Kpi title="Total Sales" value={data?.totalSales ?? 0} />
        <Kpi
          title="Revenue"
          value={`₱ ${Number(data?.totalRevenue || 0).toLocaleString()}`}
        />
      </div>
    </div>
  );
}
function Kpi({ title, value }) {
  return (
    <div className="p-5 card">
      <div className="text-sm text-neutral-600">{title}</div>
      <div className="mt-1 text-3xl font-semibold text-brand-primary">
        {value}
      </div>
    </div>
  );
}
