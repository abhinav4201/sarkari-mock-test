// src/components/LibraryNavbar.js
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "../components/ui/NotificationBell"; // Import the bell

export default function LibraryNavbar() {
  const { logOut } = useAuth();

  return (
    <nav className='bg-slate-900 shadow-lg sticky top-0 z-50'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex-shrink-0'>
            <Link
              href='/library-dashboard'
              className='text-2xl font-bold text-white'
            >
              Sarkari Mock Test
            </Link>
          </div>
          <div className='flex items-center gap-1 sm:gap-2'>
            <Link
              href='/library-dashboard'
              className='px-3 py-2 text-indigo-100 font-medium hover:text-white rounded-md text-sm sm:text-base'
            >
              Dashboard
            </Link>
            <Link
              href='/mock-tests'
              className='px-3 py-2 text-indigo-100 font-medium hover:text-white rounded-md text-sm sm:text-base'
            >
              Tests
            </Link>
            <Link
              href='/contact'
              className='px-3 py-2 text-indigo-100 font-medium hover:text-white rounded-md text-sm sm:text-base'
            >
              Contact
            </Link>
            <NotificationBell />
            <button
              onClick={logOut}
              className='px-4 py-2 bg-blue-500/50 text-white rounded-lg text-sm font-semibold hover:bg-blue-500'
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
