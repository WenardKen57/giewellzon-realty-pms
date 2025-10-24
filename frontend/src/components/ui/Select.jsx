export default function Select({ label, error, className='', children, ...rest }) {
  return (
    <label className="block space-y-1 text-sm">
      {label && <span className="font-medium">{label}</span>}
      <select
        className={`input pr-8 ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}