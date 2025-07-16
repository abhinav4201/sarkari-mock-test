// src/components/admin/AdminMobileNav.js

"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";

export default function AdminMobileNav({ adminLinks, isOpen, onClose }) {
  const { user, logOut } = useAuth();

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/60 z-40 md:hidden'
        onClick={onClose}
        aria-hidden='true'
      ></div>

      {/* Modal Panel */}
      <div className='fixed inset-0 z-50 flex justify-center items-center p-4 md:hidden'>
        <div className='bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col'>
          <div className='flex justify-between items-center p-4 border-b border-slate-200'>
            <h2 className='font-bold text-slate-800'>Admin Menu</h2>
            <button
              onClick={onClose}
              className='p-2 rounded-full hover:bg-slate-100'
            >
              <X className='h-6 w-6 text-slate-600' />
            </button>
          </div>

          <nav className='flex-grow p-4 overflow-y-auto'>
            {adminLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={onClose}
                className='flex items-center p-3 rounded-lg font-medium mb-2 text-slate-700 hover:bg-slate-100'
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
          </nav>

          <div className='p-4 border-t border-slate-200'>
            {user && (
              <div className='px-3 py-2 mb-2 text-center'>
                <p className='text-sm font-medium text-slate-800 truncate'>
                  {user.displayName}
                </p>
                <p className='text-xs text-slate-500 truncate'>{user.email}</p>
              </div>
            )}
            <button
              onClick={logOut}
              className='w-full flex items-center justify-center p-3 rounded-lg font-medium text-red-600 bg-red-50 hover:bg-red-100'
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
