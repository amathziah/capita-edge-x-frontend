import React from 'react';

export const Label = ({
    children,
    className,
    required,
}: {
    children: React.ReactNode;
    className?: string;
    required?: boolean;
}) => {
    return (
        <label
            className={`text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5 ${className}`}
        >
            {children}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    );
};
