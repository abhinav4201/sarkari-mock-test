"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Menu, X } from "lucide-react";

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

  // Define link sets for different roles
  const publicLinks = (
    <>
      <Link
        href='/'
        className='block md:inline-block py-2 px-4 md:px-3 text-slate-900 font-medium hover:bg-slate-100 rounded-md'
        onClick={closeMobileMenu}
      >
        Home
      </Link>
      <Link
        href='/blog'
        className='block md:inline-block py-2 px-4 md:px-3 text-slate-900 font-medium hover:bg-slate-100 rounded-md'
        onClick={closeMobileMenu}
      >
        Blog
      </Link>
      <Link
        href='/mock-tests'
        className='block md:inline-block py-2 px-4 md:px-3 text-slate-900 font-medium hover:bg-slate-100 rounded-md'
        onClick={closeMobileMenu}
      >
        Tests
      </Link>
      <Link
        href='/contact'
        className='block md:inline-block py-2 px-4 md:px-3 text-slate-900 font-medium hover:bg-slate-100 rounded-md'
        onClick={closeMobileMenu}
      >
        Contact
      </Link>
    </>
  );

  const userLinks = (
    <Link
      href='/dashboard'
      className='block md:inline-block py-2 px-4 md:px-3 text-slate-900 font-medium hover:bg-slate-100 rounded-md'
      onClick={closeMobileMenu}
    >
      Dashboard
    </Link>
  );

  const adminLinks = (
    <Link
      href='/admin'
      className='block md:inline-block py-2 px-4 md:px-3 font-bold text-red-600 hover:bg-red-100 rounded-md'
      onClick={closeMobileMenu}
    >
      Admin Dashboard
    </Link>
  );

  return (
    <nav className='bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex-shrink-0'>
            <Link href='/' className='text-2xl font-bold text-indigo-600'>
              Sarkari Mock Test
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:flex md:items-center md:space-x-2 lg:space-x-4'>
            {publicLinks}
            {!loading &&
              user &&
              (user.email === adminEmail ? adminLinks : userLinks)}
          </div>

          {/* Desktop Auth Buttons */}
          <div className='hidden md:flex items-center space-x-4'>
            {loading ? (
              <div className='h-8 w-24 bg-slate-200 rounded-lg animate-pulse'></div>
            ) : !user ? (
              <button
                onClick={handleSignIn}
                className='px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm'
              >
                Login / Sign Up
              </button>
            ) : (
              <button
                onClick={handleSignOut}
                className='px-4 py-2 bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-colors'
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className='md:hidden flex items-center'>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100'
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className='md:hidden'>
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
            {publicLinks}
            <div className='border-t my-2'></div>
            {loading ? null : !user ? (
              <div className='p-2'>
                <button
                  onClick={handleSignIn}
                  className='w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors'
                >
                  Login / Sign Up
                </button>
              </div>
            ) : (
              <div className='p-2 space-y-2'>
                {user.email === adminEmail ? adminLinks : userLinks}
                <button
                  onClick={handleSignOut}
                  className='w-full px-4 py-2 bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-colors'
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
