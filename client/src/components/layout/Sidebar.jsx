import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Home,
  Users,
  FolderLock,
  FileSignature,
  Receipt,
  Zap,
  BookOpenText,
  BadgePercent,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  ShieldCheck,
  ChevronRight,
  X,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Rooms', path: '/rooms', icon: Home },
  { name: 'Tenants', path: '/tenants', icon: Users },
  { name: 'Documents', path: '/documents', icon: FolderLock },
  { name: 'Rental Agreements', path: '/agreements', icon: FileSignature },
  { name: 'Rent Management', path: '/rent', icon: Receipt },
  { name: 'Electricity', path: '/electricity', icon: Zap },
  { name: 'Tenant Ledger', path: '/ledger', icon: BookOpenText },
  { name: 'Expenses', path: '/expenses', icon: BadgePercent },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-64 bg-[#0f172a] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-2xl border-r border-slate-800`}
      >
        {/* Brand / House Header */}
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25 text-white font-black text-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-black text-white tracking-tight truncate max-w-[130px]">
                  KirayaKhata
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
                    {user?.houseName || 'Owner Portal'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto overscroll-contain max-h-[calc(100dvh-190px)] sm:max-h-[calc(100vh-190px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 group ${
                      isActive
                        ? 'bg-orange-500/15 text-orange-400 font-bold border-l-2 border-orange-500 pl-3'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Owner Profile & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-orange-500/30">
                {user?.name ? user.name[0] : 'O'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{user?.name || 'Owner'}</div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3 text-orange-400 inline" />
                  Owner Access Only
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10px] text-center text-slate-400 px-2 font-medium">
            Single Residential Property • Private
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
