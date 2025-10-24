import { useState, useCallback } from 'react';
export default function useModal(initial=false) {
  const [open,setOpen]=useState(initial);
  const show = useCallback(()=>setOpen(true),[]);
  const hide = useCallback(()=>setOpen(false),[]);
  return { open, show, hide };
}