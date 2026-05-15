import React from "react";

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const NeuInput: React.FC<NeuInputProps> = ({ label, error, className = "", ...props }) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block font-['Bebas_Neue'] text-xl uppercase tracking-widest text-black">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 bg-white border-2 border-black font-['Inter'] text-black placeholder:text-gray-400 focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-red-600 font-['Inter'] text-sm font-bold uppercase">{error}</p>}
    </div>
  );
};
