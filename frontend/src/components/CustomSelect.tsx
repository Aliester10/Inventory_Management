import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function CustomSelect({ options, value, onChange, className, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={clsx("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 bg-white border-[3px] border-[#1a1a1a] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] flex items-center justify-between gap-2 font-bold cursor-pointer hover:bg-yellow-100 transition-colors focus:outline-none focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none"
      >
        <span className="whitespace-nowrap">{selectedOption ? selectedOption.label : placeholder || 'Pilih...'}</span>
        <ChevronDown size={16} className={clsx("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full min-w-[140px] bg-white border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] overflow-hidden">
          <ul className="max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(String(opt.value));
                  setIsOpen(false);
                }}
                className={clsx(
                  "px-3 py-2 cursor-pointer font-bold border-b-[3px] border-[#1a1a1a] last:border-b-0 transition-colors",
                  value === opt.value ? "bg-[#00cecb] text-black" : "hover:bg-yellow-100 text-black"
                )}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
