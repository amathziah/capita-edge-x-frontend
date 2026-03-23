import React, { useState } from "react";

export const SearchableSelect: React.FC<{
  label: string;
  options: { value: any; label: string; icon?: React.ReactNode }[];
  value: any;
  onChange: (val: any) => void;
  placeholder?: string;
  className?: string;
}> = ({ label, options, value, onChange, placeholder = "Search...", className }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const activeLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className="relative space-y-1.5 w-full">
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <div 
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-bold text-gray-800 cursor-pointer hover:bg-white hover:border-teal-200 transition-all ${className || ''}`}
      >
        <span className="truncate">{activeLabel}</span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </div>
      
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-teal-100 rounded-xl shadow-xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1 border-b border-gray-50">
            <input 
              autoFocus
              type="text" 
              placeholder={placeholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 text-xs font-semibold rounded-lg border-none focus:ring-0 placeholder:text-gray-300"
            />
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filtered.length > 0 ? filtered.map(o => (
              <div 
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold cursor-pointer transition-colors ${value === o.value ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {o.icon}
                {o.label}
              </div>
            )) : (
              <div className="px-4 py-3 text-[10px] text-gray-400 font-bold uppercase text-center">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
