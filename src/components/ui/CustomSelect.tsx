import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    icon?: React.ElementType;
    description?: string;
}

interface CustomSelectProps {
    label?: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchable?: boolean;
    className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    label,
    options,
    value,
    onChange,
    placeholder = "Select an option",
    searchable = true,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, searchable]);

    return (
        <div className={`space-y-1.5 w-full ${className}`} ref={containerRef}>
            {label && (
                <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 ml-0.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {/* Trigger */}
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className={`group flex items-center justify-between w-full px-4 py-2.5 bg-white border ${isOpen ? 'border-primary ring-2 ring-primary/10' : 'border-gray-200 hover:border-gray-300'
                        } rounded-xl shadow-sm transition-all duration-200 cursor-pointer`}
                >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        {selectedOption?.icon && (
                            <selectedOption.icon className="w-4 h-4 text-primary shrink-0" strokeWidth={2.4} />
                        )}
                        <span className={`text-sm truncate ${!selectedOption ? 'text-gray-400' : 'font-semibold text-gray-900'}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>

                {/* Dropdown Panel */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                            className="absolute z-[100] w-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden backdrop-blur-xl bg-white/95"
                        >
                            {searchable && (
                                <div className="p-2 border-b border-gray-50 sticky top-0 bg-white/80 backdrop-blur-sm z-10">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            className="w-full pl-9 pr-8 py-2 bg-gray-50/50 border-none rounded-lg text-sm focus:ring-0 focus:outline-none placeholder:text-gray-400"
                                            placeholder="Search options..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm("")}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                                {filteredOptions.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-gray-500">
                                        <p className="text-xs font-medium">No results found</p>
                                    </div>
                                ) : (
                                    filteredOptions.map((option) => (
                                        <div
                                            key={option.value}
                                            onClick={() => {
                                                onChange(option.value);
                                                setIsOpen(false);
                                                setSearchTerm("");
                                            }}
                                            className={`flex items-center justify-between px-4 py-2.5 transition-all duration-200 cursor-pointer group ${value === option.value
                                                    ? 'bg-primary/5 text-primary'
                                                    : 'hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-1.5 rounded-lg transition-colors ${value === option.value ? 'bg-primary/10' : 'bg-gray-100 group-hover:bg-white'
                                                    }`}>
                                                    {option.icon ? (
                                                        <option.icon className={`w-3.5 h-3.5 ${value === option.value ? 'text-primary' : 'text-gray-500'}`} strokeWidth={2.4} />
                                                    ) : (
                                                        <div className={`w-3.5 h-3.5 rounded-full ${value === option.value ? 'bg-primary' : 'bg-gray-200'}`} />
                                                    )}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className={`text-sm tracking-tight ${value === option.value ? 'font-bold' : 'font-medium'}`}>
                                                        {option.label}
                                                    </p>
                                                    {option.description && (
                                                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                                            {option.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {value === option.value && (
                                                <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={3} />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
