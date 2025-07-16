// src/components/Navbar.js
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import NotificationBell from "./ui/NotificationBell"; // Import the bell

export default function Navbar() {
  const { user, loading, googleSignIn, logOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const handleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error(error);
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const linkClasses =
    "block md:inline-block py-2 px-4 md:px-3 text-indigo-100 font-medium hover:text-white rounded-md transition-colors";

  const homeLink = (
    <Link href='/' className={linkClasses} onClick={closeMobileMenu}>
      Home
    </Link>
  );

  const publicLinks = (
    <>
      <Link href='/blog' className={linkClasses} onClick={closeMobileMenu}>
        Blog
      </Link>
      <Link
        href='/mock-tests'
        className={linkClasses}
        onClick={closeMobileMenu}
      >
        Tests
      </Link>
      <Link href='/contact' className={linkClasses} onClick={closeMobileMenu}>
        Contact
      </Link>
    </>
  );

  const userLinks = (
    <Link href='/dashboard' className={linkClasses} onClick={closeMobileMenu}>
      Dashboard
    </Link>
  );

  const adminLinks = (
    <Link
      href='/admin'
      className='block md:inline-block py-2 px-4 md:px-3 font-bold text-yellow-300 hover:text-white rounded-md'
      onClick={closeMobileMenu}
    >
      Admin Panel
    </Link>
  );

  let logoHref = "/";
  if (user) {
    logoHref = user.email === adminEmail ? "/admin" : "/dashboard";
  }

  return (
    <nav className='bg-slate-900 shadow-lg sticky top-0 z-50'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          <div className='flex-shrink-0'>
            <Link href={logoHref} className='text-2xl font-bold text-white'>
              Sarkari Mock Test
            </Link>
          </div>

          <div className='hidden md:flex md:items-center md:space-x-1 lg:space-x-2'>
            {!user && homeLink}
            {publicLinks}
            {!loading &&
              user &&
              (user.email === adminEmail ? adminLinks : userLinks)}
          </div>

          <div className='hidden md:flex items-center space-x-2'>
            {loading ? (
              <div className='h-9 w-28 bg-blue-500 rounded-lg animate-pulse'></div>
            ) : !user ? (
              <button
                onClick={handleSignIn}
                className='px-5 py-2 bg-white text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors shadow-sm'
              >
                Login / Sign Up
              </button>
            ) : (
              <>
                <NotificationBell />
                <button
                  onClick={handleSignOut}
                  className='px-4 py-2 bg-blue-500/50 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors'
                >
                  Logout
                </button>
              </>
            )}
          </div>

          <div className='md:hidden flex items-center'>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='inline-flex items-center justify-center p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-600'
            >
              {isMobileMenuOpen ? (
                <X className='h-6 w-6' />
              ) : (
                <Menu className='h-6 w-6' />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className='md:hidden'>
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
            {!user && homeLink}
            {publicLinks}
            <div className='border-t border-indigo-700 my-2'></div>
            {loading ? null : !user ? (
              <div className='p-2'>
                <button
                  onClick={handleSignIn}
                  className='w-full px-4 py-2 bg-white text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors'
                >
                  Login / Sign Up
                </button>
              </div>
            ) : (
              <div className='p-2 space-y-2'>
                {user.email === adminEmail ? adminLinks : userLinks}
                <button
                  onClick={handleSignOut}
                  className='w-full px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors'
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
