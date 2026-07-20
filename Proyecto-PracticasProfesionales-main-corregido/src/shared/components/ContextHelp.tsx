import { useState } from "react";

type ContextHelpProps = {
  title?: string;
  message: string;
};

export function ContextHelp({ title = "Ayuda contextual", message }: ContextHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        aria-label={title}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-white text-sm font-bold text-[#1565c0] hover:bg-blue-50"
      >
        ?
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-30 w-80 rounded-xl border border-blue-100 bg-white p-3 text-sm text-gray-700 shadow-xl">
          <p className="font-semibold text-[#0d2b5e]">{title}</p>
          <p className="mt-1 leading-5">{message}</p>
        </div>
      )}
    </div>
  );
}
