import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

export function LineChartCard({ title, data, dataKey='value', xKey='label', color='#0b4d25' }) {
  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#eee" strokeDasharray="4 4" />
            <XAxis dataKey={xKey} fontSize={10}/>
            <YAxis fontSize={10}/>
            <Tooltip />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BarChartCard({ title, data, dataKey='value', xKey='label', color='#0b4d25' }) {
  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#eee" strokeDasharray="4 4" />
            <XAxis dataKey={xKey} fontSize={10}/>
            <YAxis fontSize={10}/>
            <Tooltip />
            <Bar dataKey={dataKey} fill={color}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}