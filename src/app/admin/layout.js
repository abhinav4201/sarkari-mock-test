"use client";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();

  // Get the admin email from environment variables
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
      <div className='flex justify-center items-center h-screen'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold'>Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // If the user is the admin, show the admin panel
  return (
    <div className='flex min-h-screen'>
      <Sidebar />
      <main className='flex-1 p-8 bg-gray-100'>{children}</main>
    </div>
  );
}
