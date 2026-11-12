import { Megaphone } from "lucide-react";
import Link from "next/link";

export function AlertasDeuda({ totalDeuda }: { totalDeuda: number }) {
  if (totalDeuda <= 0) return null;

  return (
    <div className="bg-red-500 text-white p-4 rounded-2xl shadow-lg shadow-red-500/30 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-pulse">
      <div className="bg-white/20 p-2 rounded-lg shrink-0 hidden sm:block">
        <Megaphone size={24} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-lg">¡Póngase las pilas! 🤨</h3>
        <p className="text-sm text-red-50 opacity-90 leading-tight mt-1">
          Tienes deudas pendientes por valor de{" "}
          <strong>${totalDeuda.toLocaleString()}</strong>.
        </p>
      </div>
      <Link
        href="/finanzas"
        className="bg-white text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors self-start sm:self-center"
      >
        Pagar Ya
      </Link>
    </div>
  );
}
