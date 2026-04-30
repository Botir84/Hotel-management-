import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
  icon?: ReactNode;
}

const variantStyles = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 shadow-sm shadow-blue-500/20',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600/60',
  danger: 'bg-red-600 hover:bg-red-500 text-white border border-red-500/50 shadow-sm shadow-red-500/20',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 border border-transparent hover:border-slate-700',
  warning: 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/50 shadow-sm shadow-amber-500/20',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  fullWidth = false,
  icon,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
