import { Logo } from '../common/Logo';

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">

        {/* Left: Logo (Mobile only) */}
        <div className="lg:hidden flex items-center gap-2">
          <Logo size={28} />
          <span className="text-lg font-semibold text-text-main">Capita</span>
        </div>

        {/* Left: Spacer (Desktop) */}
        <div className="hidden lg:block"></div>

        {/* Right: Actions (Empty for now) */}
        <div className="flex items-center space-x-2 lg:space-x-4">
        </div>
      </div>
    </header>
  );
}
