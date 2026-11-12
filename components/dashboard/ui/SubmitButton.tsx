"use client";

import { useFormStatus } from "react-dom";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loadingText?: string;
}

export function SubmitButton({
  children,
  loadingText = "Procesando...",
  className,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      className={`${className} transition-all ${pending ? "opacity-70 cursor-not-allowed" : ""}`}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={16} />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
