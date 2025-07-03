"use client";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/admin/Sidebar";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || user.email !== adminEmail) {
    return (
      <div className='flex justify-center items-center h-screen text-center'>
        <div>
          <h1 className='text-2xl font-bold'>Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-slate-100'>
      {/* Mobile Header with Hamburger Menu */}
      <header className='md:hidden bg-white shadow-md p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-20'>
        <p className='font-bold text-indigo-600'>Admin Panel</p>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 md:relative md:translate-x-0`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className='flex-1 p-4 sm:p-6 lg:p-8 mt-16 md:mt-0'>{children}</main>
    </div>
  );
}
