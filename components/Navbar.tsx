'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { GraduationCap, Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/login', label: 'Login' },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="fixed top-4 left-0 right-0 z-50 px-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-950/95 backdrop-blur border border-slate-800 rounded-2xl shadow-xl shadow-black/40">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <div className="shrink-0">
              <Link
                href="/"
                className="text-xl font-bold text-zinc-600 flex items-end whitespace-nowrap pt-4 pl-4"
              >
                <div className="relative flex flex-col items-center">
                  <GraduationCap className="absolute -top-5 -left-4 w-8 h-8 text-zinc-400 -rotate-12" />
                  <span className="text-transparent bg-clip-text bg-linear-to-b from-white to-slate-500 text-3xl font-bold">
                    S
                  </span>
                </div>
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-b from-white to-slate-500">
                  killmap
                </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-8">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`relative px-1 py-2 text-sm font-medium transition-colors duration-200 group ${
                      pathname === href
                        ? 'text-purple-400'
                        : 'text-slate-300 hover:text-purple-400'
                    }`}
                  >
                    {label}
                    <span
                      className={`absolute inset-x-0 bottom-0 h-0.5 bg-purple-400 transform transition-transform duration-200 ease-out ${
                        pathname === href ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-purple-400 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
              isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-slate-800">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                    pathname === href
                      ? 'text-purple-400 bg-slate-900'
                      : 'text-slate-300 hover:text-purple-400 hover:bg-slate-900'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
