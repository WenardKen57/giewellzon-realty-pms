import { useEffect, useState } from 'react';
import { subscribe } from '../../utils/notify';
import clsx from 'clsx';

export default function Toaster() {
  const [items,setItems]=useState([]);
  useEffect(()=>{
    const unsub = subscribe(ev => {
      if (ev.dismiss) {
        setItems(prev => prev.filter(p => p.id !== ev.id));
      } else {
        setItems(prev => [...prev, ev]);
      }
    });
    return () => unsub();
  },[]);
  return (
    <div className="fixed z-50 space-y-2 top-4 right-4">
      {items.map(item=>(
        <div key={item.id}
          className={clsx(
            'px-3 py-2 rounded shadow text-sm text-white',
            item.type==='success' && 'bg-green-600',
            item.type==='error' && 'bg-red-600',
            item.type==='info' && 'bg-neutral-700',
            item.type==='warn' && 'bg-yellow-600'
          )}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}