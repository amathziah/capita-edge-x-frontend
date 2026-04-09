import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export const SearchableSelect: React.FC<{
  label?: string;
  options: { value: any; label: string; icon?: React.ReactNode }[];
  value: any;
  onChange: (val: any) => void;
  placeholder?: string;
  className?: string;
}> = ({ label, options, value, onChange, placeholder = "Search...", className }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const activeOption = options.find(o => o.value === value);
  const activeLabel = activeOption?.label || placeholder;

  // Smart Positioning: Detect if we should open upward
  useLayoutEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      // If less than 250px below, open upward
      if (spaceBelow < 250) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [open]);

  // Robust Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("touchstart", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5 px-0.5">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => {
          setOpen(!open);
          if (!open) setSearch(""); // Reset search when opening
        }}
        className={`flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 cursor-pointer hover:bg-gray-50 transition-colors ${className || ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          {activeOption?.icon}
          <span className="truncate">{activeLabel}</span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>
      
      {open && (
        <div 
          ref={dropdownRef}
          className={`absolute left-0 w-full bg-white border border-gray-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] z-[200] overflow-hidden ${
            openUpward ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'
          }`}
        >
          <div className="p-1.5 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                autoFocus
                type="text" 
                placeholder={placeholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 bg-white text-[12px] font-medium rounded-lg border border-gray-200 focus:border-gray-200 focus:ring-0 outline-none transition-colors placeholder:text-gray-400"
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filtered.length > 0 ? filtered.map(o => (
              <div 
                key={o.value}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent extra events
                  onChange(o.value); 
                  setOpen(false); 
                  setSearch(""); 
                }}
                className={`flex items-center justify-between px-3 py-2 text-[12px] font-medium cursor-pointer transition-colors ${value === o.value ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  {o.icon}
                  {o.label}
                </div>
                {value === o.value && <Check size={14} className="text-teal-600" />}
              </div>
            )) : (
              <div className="px-4 py-3 text-xs text-gray-400 font-medium text-center italic">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
