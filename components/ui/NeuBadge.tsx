import React from "react";

interface NeuBadgeProps {
  children: React.ReactNode;
  tone?: "info" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}

export const NeuBadge: React.FC<NeuBadgeProps> = ({
  children,
  tone = "neutral",
  className = "",
}) => {
  const tones = {
    info: "bg-blue-100 text-blue-900",
    success: "bg-green-100 text-green-900",
    warning: "bg-yellow-100 text-yellow-900",
    danger: "bg-red-100 text-red-900",
    neutral: "bg-gray-100 text-gray-900",
  };

  return (
    <span
      className={`inline-block px-3 py-1 border-2 border-black font-['Bebas_Neue'] text-sm uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
};
