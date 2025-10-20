'use client';

import { useState, useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { LogOut, User, Home } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left: Logo */}
        <Link
          href="/"
          className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text"
        >
          CourseHub
        </Link>

        {/* Right: Navigation + Profile */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 px-3 py-2 rounded hover:bg-blue-50 transition"
          >
            <Home className="w-5 h-5" /> Home
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 px-3 py-2 rounded hover:bg-blue-50 transition"
          >
            <User className="w-5 h-5" /> Dashboard
          </Link>

          {session ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold"
              >
                {session.user.email?.charAt(0).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border p-3 z-50">
                  <p className="text-gray-700 font-medium mb-2 truncate">{session.user.email}</p>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-2 text-red-600 font-semibold w-full px-2 py-1 rounded hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
