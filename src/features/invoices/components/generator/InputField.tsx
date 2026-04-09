import React from 'react';

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
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                {label}
                {required && <span className="text-red-400 text-[10px]">*</span>}
                {optional && (
                    <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-gray-400 normal-case tracking-normal bg-gray-100/80 px-1.5 py-0.5 rounded-md">
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
            className={`bg-gray-50/50 backdrop-blur-sm border-0 border-b-2 rounded-t-xl px-4 py-3 text-sm font-semibold outline-none transition-all duration-200 text-gray-800 placeholder-gray-300 shadow-sm ${error
                    ? 'border-red-400 bg-red-50/30 focus:border-red-500'
                    : 'border-gray-100'
                } ${readOnly
                    ? 'cursor-not-allowed text-gray-400 bg-gray-100/30 border-gray-200'
                    : 'focus:border-primary focus:bg-white hover:bg-gray-100/40'
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
