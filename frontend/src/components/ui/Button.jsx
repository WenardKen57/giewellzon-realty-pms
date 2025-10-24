import clsx from 'clsx';

export default function Button({ children, variant='primary', className='', ...rest }) {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded text-sm font-medium transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-brand-green text-white hover:bg-green-800',
        variant === 'secondary' && 'bg-neutral-200 hover:bg-neutral-300',
        variant === 'outline' && 'border border-brand-green text-brand-green hover:bg-brand-green hover:text-white',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}