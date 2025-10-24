export default function Table({ columns, data, keyField='_id', emptyMessage='No data' }) {
  return (
    <div className="overflow-x-auto bg-white border rounded border-neutral-200">
      <table className="min-w-full text-xs">
        <thead className="uppercase bg-neutral-100 text-neutral-700">
          <tr>
            {columns.map(col => (
              <th key={col.key || col.label} className="px-3 py-2 font-semibold text-left">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-neutral-500">
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.map(row => (
            <tr key={row[keyField]} className="border-t hover:bg-neutral-50">
              {columns.map(col => (
                <td key={col.key || col.label} className="px-3 py-2">
                  {col.render ? col.render(row) : (row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}