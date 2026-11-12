"use client";

import { useEffect, useState } from "react";
import { Sparkles, Shield, Home } from "lucide-react";

interface WelcomeCardProps {
  apodo?: string;
  casa?: string;
  es_adjudicado?: boolean;
}

export function WelcomeCard({ apodo, casa, es_adjudicado }: WelcomeCardProps) {
  const [saludo, setSaludo] = useState("Hola");

  useEffect(() => {
    const calcularSaludo = () => {
      // Forzar zona horaria de Colombia
      const horaColombia = new Date().toLocaleString("en-US", {
        timeZone: "America/Bogota",
        hour: "numeric",
        hour12: false,
      });

      const horaActual = parseInt(horaColombia, 10);

      if (horaActual >= 5 && horaActual < 12) {
        setSaludo("Buenos días");
      } else if (horaActual >= 12 && horaActual < 19) {
        setSaludo("Buenas tardes"); // 5 PM (17) caerá aquí
      } else {
        setSaludo("Buenas noches");
      }
    };

    calcularSaludo();
  }, []);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
      <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-unicor-primary/5 to-transparent pointer-events-none"></div>
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-4 border-unicor-primary/10 transition-transform group-hover:scale-110 pointer-events-none"></div>
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full border-4 border-unicor-secondary/10 transition-transform group-hover:scale-125 pointer-events-none"></div>

      <div className="relative z-10 w-full">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight flex flex-wrap items-center gap-2">
          <span>{saludo},</span>
          <span className="text-unicor-primary bg-clip-text text-transparent bg-gradient-to-r from-unicor-primary to-unicor-secondary">
            {apodo || "Residente"}
          </span>
          .
        </h1>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 text-sm font-bold text-gray-600">
            <Home size={16} className="text-gray-400" />
            {casa || "Sin Sede"}
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm transition-colors border
                        ${
                          es_adjudicado
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-indigo-50 text-indigo-700 border-indigo-100"
                        }`}
          >
            {es_adjudicado ? <Shield size={16} /> : <Sparkles size={16} />}
            {es_adjudicado ? "Residente Oficial" : "En Periodo de Prueba"}
          </div>
        </div>
      </div>
    </div>
  );
}
