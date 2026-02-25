import React from 'react';
import { Info } from 'lucide-react';

interface InputFieldProps {
    label?: string;
    type?: string;
    value: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder?: string;
    className?: string;
    readOnly?: boolean;
    /** Show red asterisk next to label */
    required?: boolean;
    /** Show subtle "(optional)" badge next to label */
    optional?: boolean;
    /** Error message to display below the input */
    error?: string;
}

/** Reusable InputField with Premium Styling */
const InputField: React.FC<InputFieldProps> = ({
    label,
    type = "text",
    value,
    onChange,
    onFocus,
    onBlur,
    placeholder,
    className = "",
    readOnly = false,
    required = false,
    optional = false,
    error,
}) => (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
        {label && (
            <label className="text-xs font-semibold text-text-light uppercase tracking-wider flex items-center gap-1.5">
                {label}
                {required && <span className="text-red-400 text-[10px]">*</span>}
                {optional && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-gray-400 normal-case tracking-normal bg-gray-100/80 px-1.5 py-0.5 rounded-md">
                        <Info size={9} strokeWidth={2.5} className="opacity-60" />
                        optional
                    </span>
                )}
            </label>
        )}
        <input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            readOnly={readOnly}
            placeholder={placeholder}
            className={`bg-gray-50/80 backdrop-blur-sm border-0 border-b-2 rounded-t-xl px-4 py-3 text-sm font-medium outline-none transition-all duration-200 text-text-main placeholder-gray-400 shadow-sm ${error
                    ? 'border-red-400 bg-red-50/30 focus:border-red-500'
                    : 'border-gray-200'
                } ${readOnly
                    ? 'cursor-not-allowed text-text-muted bg-gray-100/50'
                    : 'focus:border-primary focus:bg-white hover:bg-gray-100/60'
                }`}
        />
        {error && (
            <p className="text-[10px] font-medium text-red-500 pl-1 flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-red-400"></span>
                {error}
            </p>
        )}
    </div>
);

export default InputField;
