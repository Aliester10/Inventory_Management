import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'default';
  children: React.ReactNode;
}

export function Button({ variant = 'default', children, className = '', ...props }: ButtonProps) {
  const baseClasses = 'neo-button px-6 py-2 border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] rounded-md transition-all font-bold cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-[2px] hover:-translate-x-[2px]';
  
  let bgClass = 'bg-white';
  if (variant === 'primary') bgClass = 'bg-[#ff5e5b] text-white';
  else if (variant === 'secondary') bgClass = 'bg-[#00cecb] text-black';
  else if (variant === 'accent') bgClass = 'bg-[#ffed66] text-black';

  return (
    <button className={`${baseClasses} ${bgClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
