interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'blue';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantMap = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/15 text-red-400 border-red-500/20',
  info: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  neutral: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
};

const dotColorMap = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-sky-400',
  neutral: 'bg-slate-400',
  blue: 'bg-blue-400',
};

export function Badge({ variant, children, size = 'sm', dot = false }: BadgeProps) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${padding} ${variantMap[variant]}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[variant]}`} />
      )}
      {children}
    </span>
  );
}
