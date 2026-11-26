"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function WorkspaceDialog({ titleId, onClose, children, className }: {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog ref={dialog} className={`workspace-dialog ${className ?? ""}`} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }}>
      {children}
    </dialog>
  );
}
