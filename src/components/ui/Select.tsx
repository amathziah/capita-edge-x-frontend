import React, { forwardRef } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { label: string; value: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        className={`flex h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ${error ? 'border-red-300 focus-visible:ring-red-200' : ''
                            } ${className}`}
                        ref={ref}
                        {...props}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    {/* Custom Chevron */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            </div>
        );
    }
);
Select.displayName = 'Select';
