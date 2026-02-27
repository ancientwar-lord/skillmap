'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import {
  LayoutDashboard,
  Settings,
  ChevronLeft,
  LogIn,
  Laptop,
  Map,
  Brain,
  GraduationCap,
} from 'lucide-react';

export default function Sidebar({
  isCollapsed = false,
  toggleSidebar,
}: {
  isCollapsed?: boolean;
  toggleSidebar?: () => void;
}) {
  const pathname = usePathname();
  const { user, logOut } = useAuth();

  const links = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      badge: '0',
    },
    {
      name: 'Planner',
      href: '/planner',
      icon: <Map size={20} />,
    },
    { name: 'Practice', href: '/practice', icon: <Brain size={20} /> },
    { name: 'Apply', href: '/apply', icon: <Laptop size={20} /> },
    { name: 'Settings', href: '/user-settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-linear-to-b from-white via-slate-50 to-purple-50/40 border-r border-purple-200/40 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 bg-linear-to-br from-purple-950 to-violet-950/40 border border-purple-400/50 rounded-full p-1 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all z-50"
      >
        <ChevronLeft
          className={`w-4 h-4 text-white transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 overflow-x-hidden">
        {/* Logo Section */}
        <div
          className={`mb-8 flex items-center ${isCollapsed ? 'justify-center' : 'px-2'}`}
        >
          {isCollapsed ? (
            <Link
              href="/dashboard"
              className="flex items-center justify-center"
            >
              <GraduationCap className="w-8 h-8 text-purple-950" />
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="text-xl font-bold text-zinc-600 flex items-end whitespace-nowrap pt-4 pl-4"
            >
              <div className="relative flex flex-col items-center">
                <GraduationCap className="absolute -top-5 -left-4 w-8 h-8 text-purple-950 -rotate-12" />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-950 to-violet-900/60 text-3xl font-bold">
                  S
                </span>
              </div>
              <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-950 to-violet-900/60 ">
                killmap
              </span>
            </Link>
          )}
        </div>

        {/* Divider */}
        <div className="my-4 px-2">
          <div className="h-px bg-linear-to-r from-transparent via-purple-200 to-violet-200/40" />
        </div>

        {/* Navigation Links */}
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              title={isCollapsed ? link.name : ''}
              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-linear-to-r from-purple-100 to-violet-100 text-purple-950 border border-purple-200/60 shadow-sm shadow-purple-200/30'
                  : 'text-slate-600 hover:bg-linear-to-r hover:from-purple-50 hover:to-violet-50/60 hover:text-purple-950 border border-transparent'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <span
                className={`shrink-0 h-5 w-5 transition-colors duration-200 ${
                  isActive
                    ? 'text-purple-950'
                    : 'text-purple-950/50 group-hover:text-purple-950'
                }`}
              >
                {link.icon}
              </span>
              {!isCollapsed && (
                <span
                  className={`ml-3 flex-1 whitespace-nowrap ${isActive ? 'text-purple-950 font-semibold' : 'text-purple-950/50 group-hover:text-purple-950'}`}
                >
                  {link.name}
                </span>
              )}
              {!isCollapsed && link.badge && (
                <span
                  className={`ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full ${
                    isActive
                      ? 'bg-purple-100 text-purple-950'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-purple-50 group-hover:text-purple-950'
                  }`}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Footer Section */}
      <div className="p-4 py-4 border-t border-purple-200/40 bg-linear-to-t from-purple-50/30 to-transparent">
        {user ? (
          <div
            className={`flex items-center gap-3 p-2 rounded-xl hover:bg-linear-to-r hover:from-purple-50 hover:to-violet-50/50 transition-all cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-600 via-purple-800 to-violet-900 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-purple-500/30">
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                <button
                  onClick={logOut}
                  className="text-xs text-purple-600 hover:text-purple-800 mt-1 block w-full text-left cursor-pointer transition-colors"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className={`flex items-center gap-3 p-2 rounded-xl hover:bg-linear-to-r hover:from-purple-100 hover:to-violet-100/50 border border-transparent hover:border-purple-200/50 transition-all cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-purple-500/30">
              <LogIn size={20} />
            </div>
            {!isCollapsed && (
              <span className="text-sm font-medium text-gray-900 ">
                Sign In
              </span>
            )}
          </Link>
        )}
      </div>
    </aside>
  );
}
