interface LogoProps {
  className?: string;
  size?: number | string;
  showBackground?: boolean;
  showBorder?: boolean;
}

export function Logo({ 
  className = "", 
  size = 36, 
  showBackground = true, 
  showBorder = true 
}: LogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden transition-all ${className}`}
      style={{ 
        width: size, 
        height: size,
        backgroundColor: showBackground ? '#0d0d0d' : 'transparent',
        boxShadow: showBackground ? '0 10px 25px -5px rgba(0, 0, 0, 0.4)' : 'none',
        border: showBorder ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
        borderRadius: typeof size === 'number' ? size * 0.22 : '22%' 
      }}
    >
      <svg 
        viewBox="0 0 110 110" 
        className="w-[85%] h-[85%]"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M80 20 L40 20 L18 42 L18 68 L40 90 L80 90 L80 76 L48 76 L32 62 L32 48 L48 34 L80 34 Z" fill="white"/>
        <path d="M58 34 L44 48 L44 62 L58 76 L68 76 L54 62 L54 48 L68 34 Z" fill="#1D9E75"/>
      </svg>
    </div>
  );
}

export function LogoText({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size={36} />
      <span className="text-xl font-bold text-white tracking-tight">Capita</span>
    </div>
  );
}
