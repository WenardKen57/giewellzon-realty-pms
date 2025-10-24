import useAuth from '../../hooks/useAuth';

export default function AdminTopbar() {
  const { user } = useAuth();
  return (
    <header className="flex items-center justify-between px-6 bg-white border-b h-14">
      <div className="text-sm font-medium">Admin Dashboard</div>
      <div className="max-w-xs text-xs truncate text-neutral-600">
        {user?.fullName || user?.username} ({user?.email})
      </div>
    </header>
  );
}