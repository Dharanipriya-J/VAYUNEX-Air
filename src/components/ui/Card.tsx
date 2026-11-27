import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** Shared surface container for dashboard panels and summary cards. */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-xs ${className}`.trim()}>
      {children}
    </div>
  );
}
