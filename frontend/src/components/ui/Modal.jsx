import Button from './Button';

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded shadow max-w-lg w-full flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-medium">{title}</h3>
          <button onClick={onClose} className="text-xs text-neutral-500 hover:text-neutral-700">✕</button>
        </div>
        <div className="p-4 overflow-auto text-sm">
          {children}
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          {footer || <Button variant="outline" onClick={onClose}>Close</Button>}
        </div>
      </div>
    </div>
  );
}