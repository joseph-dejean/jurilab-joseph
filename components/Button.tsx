import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  isLoading,
  icon,
  iconPosition = 'left',
  disabled,
  ...props 
}) => {
  const baseClasses = `
    relative inline-flex items-center justify-center font-semibold
    rounded-xl transition-all duration-300 ease-smooth
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
    dark:focus-visible:ring-offset-deep-950
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    overflow-hidden
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-br from-primary-500 to-primary-600 
      text-white font-semibold
      shadow-md hover:shadow-lg hover:shadow-primary-500/25
      hover:from-primary-400 hover:to-primary-500
      active:from-primary-600 active:to-primary-700
      focus-visible:ring-primary-500
      dark:from-primary-600 dark:to-primary-700
      dark:hover:from-primary-500 dark:hover:to-primary-600
    `,
    secondary: `
      bg-surface-100 dark:bg-deep-800 
      text-deep-700 dark:text-surface-200
      border border-surface-200 dark:border-deep-700
      hover:bg-surface-200 dark:hover:bg-deep-700
      hover:border-surface-300 dark:hover:border-deep-600
      focus-visible:ring-primary-500
      shadow-sm hover:shadow-md
    `,
    outline: `
      bg-transparent border-2 border-primary-500 
      text-primary-600 dark:text-primary-400
      hover:bg-primary-50 dark:hover:bg-primary-950/50
      hover:border-primary-600 dark:hover:border-primary-400
      focus-visible:ring-primary-500
    `,
    ghost: `
      bg-transparent 
      text-deep-600 dark:text-surface-300
      hover:bg-surface-100 dark:hover:bg-deep-800
      focus-visible:ring-primary-500
    `,
    accent: `
      bg-gradient-to-br from-accent-500 to-accent-600
      text-deep-900 font-semibold
      shadow-md hover:shadow-lg hover:shadow-accent-500/25
      hover:from-accent-400 hover:to-accent-500
      active:from-accent-600 active:to-accent-700
      focus-visible:ring-accent-500
    `,
    danger: `
      bg-gradient-to-br from-red-500 to-red-600
      text-white font-semibold
      shadow-md hover:shadow-lg hover:shadow-red-500/25
      hover:from-red-400 hover:to-red-500
      active:from-red-600 active:to-red-700
      focus-visible:ring-red-500
    `,
  };

  const sizeClasses = {
    sm: 'px-3.5 py-2 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-2.5',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const loadingSpinner = (
    <svg 
      className={`animate-spin ${iconSizeClasses[size]}`}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${isLoading ? 'cursor-wait' : ''} 
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shine effect overlay */}
      <span className="absolute inset-0 overflow-hidden rounded-xl">
        <span 
          className="absolute inset-0 -translate-x-full group-hover:animate-shimmer"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
          }}
        />
      </span>
      
      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {isLoading ? (
          loadingSpinner
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className={iconSizeClasses[size]}>{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className={iconSizeClasses[size]}>{icon}</span>
            )}
          </>
        )}
      </span>
    </button>
  );
};
