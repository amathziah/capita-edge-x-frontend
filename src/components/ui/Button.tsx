import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        const baseStyles =
            'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white';

        const variants = {
            primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-200',
            secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50',
            ghost: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
            danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 py-2',
            lg: 'h-12 px-8 text-base',
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && (
                    <svg
                        className="mr-2 h-4 w-4 animate-spin"
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
                )}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';
