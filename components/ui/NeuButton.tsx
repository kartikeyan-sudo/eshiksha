import React from "react";

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const NeuButton: React.FC<NeuButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles = "brutalist-button";
  
  const variantStyles = {
    primary: "primary",
    secondary: "",
    accent: "accent",
    ghost: "border-none shadow-none bg-transparent hover:bg-gray-100",
    danger: "bg-red-600 text-white",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-lg",
    lg: "px-8 py-4 text-xl",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : ""
      }`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
