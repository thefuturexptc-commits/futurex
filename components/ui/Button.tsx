import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading, 
  disabled,
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:ring-offset-2 focus:ring-offset-[#020611] disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#0b2a6e] via-[#0d3f9f] to-[#1167c7] hover:from-[#0f3384] hover:via-[#1552be] hover:to-[#1678e6] text-white shadow-lg shadow-cyan-700/30 border border-cyan-400/30",
    secondary: "bg-gradient-to-r from-[#0b1224] to-[#122342] hover:from-[#101a32] hover:to-[#17305a] text-cyan-100 border border-cyan-800/40 shadow-lg shadow-black/35",
    outline: "border-2 border-cyan-700/60 hover:border-cyan-400/80 text-cyan-100 hover:text-white bg-[#050b17]/60 hover:bg-[#0a1a34]/75",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-3.5 text-lg"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} holi-btn holi-btn-${variant} ${className}`} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};
