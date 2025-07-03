// components/ClientAdminLayout.js
"use client";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/admin/Sidebar";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function ClientAdminLayout({ children }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen bg-slate-100'>
        <p className='text-lg font-medium text-slate-700'>
          Loading Admin Panel...
        </p>
      </div>
    );
  }

  if (user && user.email === adminEmail) {
    return (
      <div className='flex min-h-screen bg-slate-100'>
        <header className='md:hidden bg-white shadow-md p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-40'>
          <Link href='/admin' className='font-bold text-indigo-600'>
            Admin Panel
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className='p-2 rounded-md hover:bg-slate-100 text-slate-800'
          >
            {sidebarOpen ? (
              <X className='h-6 w-6' />
            ) : (
              <Menu className='h-6 w-6' />
            )}
          </button>
        </header>

        {sidebarOpen && (
          <div
            className='md:hidden fixed inset-0 bg-black/30 z-20'
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div
          className={`fixed inset-y-0 left-0 z-30 transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
        >
          <Sidebar />
        </div>

        <main className='flex-1 p-4 sm:p-6 lg:p-8 pt-20 md:pt-8'>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className='flex justify-center items-center h-screen text-center p-4'>
      <div>
        <h1 className='text-2xl font-bold'>Access Denied</h1>
        <p className='mt-2 text-slate-700'>
          You do not have permission to view this page.
        </p>
      </div>
    </div>
  );
}
