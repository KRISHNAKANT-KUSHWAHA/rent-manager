import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Shield, MapPin, Building2 } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium truncate">
          <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span className="truncate max-w-[220px] sm:max-w-md font-semibold text-slate-700">
            {user?.houseAddress || 'Residential Property'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-800 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-orange-600" />
          <span>Owner Authenticated</span>
        </div>

        {/* Owner profile display */}
        <div className="flex items-center gap-2 pl-2 sm:border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {user?.name ? user.name[0] : 'O'}
          </div>
          <span className="hidden md:inline text-xs font-bold text-slate-800">
            {user?.name || 'Owner'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
