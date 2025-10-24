import clsx from 'clsx';
export default function Badge({ children, variant='default' }) {
  return (
    <span className={clsx(
      'badge',
      variant === 'success' && 'badge-success',
      variant === 'danger' && 'badge-danger'
    )}>{children}</span>
  );
}