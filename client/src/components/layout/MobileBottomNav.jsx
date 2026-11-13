import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  Users,
  Receipt,
  Zap,
  Menu,
} from 'lucide-react';

const mobileNavItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Rooms', path: '/rooms', icon: Home },
  { name: 'Tenants', path: '/tenants', icon: Users },
  { name: 'Rent', path: '/rent', icon: Receipt },
  { name: 'Electricity', path: '/electricity', icon: Zap },
];

const MobileBottomNav = ({ onOpenMore }) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[54px] select-none ${
                  isActive
                    ? 'text-orange-600 font-bold'
                    : 'text-slate-400 hover:text-slate-700 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative p-1 rounded-lg transition-transform ${
                      isActive ? 'bg-orange-50 text-orange-600 scale-105' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight leading-tight">
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More / Menu trigger to open the full drawer */}
        <button
          type="button"
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-700 transition-all duration-150 min-w-[54px] select-none cursor-pointer"
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-5 h-5 shrink-0" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-tight">
            More
          </span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
