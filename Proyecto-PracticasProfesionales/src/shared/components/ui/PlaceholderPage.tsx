import { Construction } from "lucide-react";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-80 text-center">
      <div className="w-16 h-16 bg-[#e3f0ff] rounded-2xl flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-[#1565c0]" />
      </div>
      <h2 className="text-xl font-bold text-[#0d2b5e] mb-2">{title}</h2>
      <p className="text-gray-500 text-sm">Esta sección está disponible en la versión completa del sistema.</p>
    </div>
  );
}
