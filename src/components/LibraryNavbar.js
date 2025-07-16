// src/components/LibraryNavbar.js
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "../components/ui/NotificationBell";
import { useState } from "react";
import { Menu, X, BarChart } from "lucide-react"; // Import BarChart for My Library Analytics

export default function LibraryNavbar() {
  // Access isLibraryOwner and ownedLibraryIds from useAuth
  const { logOut, isLibraryOwner, ownedLibraryIds } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Reusable link component for mobile menu
  const MobileNavLink = ({ href, children, isOwnerSpecific = false }) => (
    <Link
      href={href}
      onClick={closeMobileMenu}
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        isOwnerSpecific ? "text-yellow-300" : "text-indigo-100" // Apply owner-specific styling
      } hover:text-white hover:bg-slate-800`}
    >
      {children}
    </Link>
  );

  return (
    <nav className='bg-slate-900 shadow-lg sticky top-0 z-50'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex-shrink-0'>
            <Link
              href={
                isLibraryOwner && ownedLibraryIds.length > 0
                  ? `/library-owner/${ownedLibraryIds[0]}`
                  : "/library-dashboard"
              } // Redirect owners to their analytics
              className='text-2xl font-bold text-white'
            >
              Sarkari Mock Test
            </Link>
          </div>

          {/* Desktop Menu Links */}
          <div className='hidden md:flex items-center gap-1 sm:gap-2'>
            {isLibraryOwner && ownedLibraryIds.length > 0 ? (
              // If it's a Library Owner, only show My Library Analytics
              <Link
                href={`/library-owner/${ownedLibraryIds[0]}`}
                className='px-3 py-2 text-yellow-300 font-medium hover:text-white rounded-md text-sm flex items-center gap-1'
              >
                <BarChart size={16} /> My Library Analytics
              </Link>
            ) : (
              // For regular library users (students), show standard links
              <>
                <Link
                  href='/library-dashboard'
                  className='px-3 py-2 text-indigo-100 font-medium hover:text-white rounded-md text-sm'
                >
                  Dashboard
                </Link>
                <Link
                  href='/mock-tests'
                  className='px-3 py-2 text-indigo-100 font-medium hover:text-white rounded-md text-sm'
                >
                  Tests
                </Link>
                <Link
                  href='/contact'
                  className='px-3 py-2 text-indigo-100 font-medium hover:text-white rounded-md text-sm'
                >
                  Contact
                </Link>
              </>
            )}
            <NotificationBell />{" "}
            {/* Notification Bell is always visible for logged-in users */}
            <button
              onClick={logOut}
              className='px-4 py-2 bg-blue-500/50 text-white rounded-lg text-sm font-semibold hover:bg-blue-500'
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className='md:hidden flex items-center'>
            <NotificationBell />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='ml-2 inline-flex items-center justify-center p-2 rounded-md text-indigo-200 hover:text-white hover:bg-slate-800'
              aria-controls='mobile-menu'
              aria-expanded='false'
            >
              <span className='sr-only'>Open main menu</span>
              {isMobileMenuOpen ? (
                <X className='block h-6 w-6' aria-hidden='true' />
              ) : (
                <Menu className='block h-6 w-6' aria-hidden='true' />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className='md:hidden' id='mobile-menu'>
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
            {isLibraryOwner && ownedLibraryIds.length > 0 ? (
              // If it's a Library Owner, only show My Library Analytics
              <MobileNavLink
                href={`/library-owner/${ownedLibraryIds[0]}`}
                isOwnerSpecific={true}
              >
                <BarChart size={16} className='inline-block mr-2' /> My Library
                Analytics
              </MobileNavLink>
            ) : (
              // For regular library users (students), show standard links
              <>
                <MobileNavLink href='/library-dashboard'>
                  Dashboard
                </MobileNavLink>
                <MobileNavLink href='/mock-tests'>Tests</MobileNavLink>
                <MobileNavLink href='/contact'>Contact</MobileNavLink>
              </>
            )}
            <div className='pt-2'>
              <button
                onClick={() => {
                  logOut();
                  closeMobileMenu();
                }}
                className='w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-200 bg-red-500/20 hover:bg-red-500/40'
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
