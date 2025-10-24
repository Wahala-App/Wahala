import React, { useRef, useEffect } from "react";

export function Dialog(isOpen: boolean, children: React.ReactNode) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dialogRef.current) {
      if (isOpen) {
        dialogRef.current.showModal(); // Opens the dialog modally
      } else {
        dialogRef.current.close(); // Closes the dialog
      }
    }
  }, [isOpen]);

  return (
    <dialog
      open={isOpen}
      className="bg-white rounded-lg p-6 shadow-lg max-w-lg w-full"
    >
      {children}
    </dialog>
  );
}
