export default function TextArea({ label, error, className='', ...rest }) {
  return (
    <label className="block space-y-1 text-sm">
      {label && <span className="font-medium">{label}</span>}
      <textarea
        className={`input min-h-[120px] ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}