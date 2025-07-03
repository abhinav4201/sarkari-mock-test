"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Fragment } from "react";

export default function Navbar() {
  const { user, loading, googleSignIn, logOut } = useAuth();
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

  return (
    <nav className='bg-white shadow-md sticky top-0 z-50'>
      <div className='container mx-auto px-6 py-3 flex justify-between items-center'>
        <Link href='/' className='text-2xl font-bold text-blue-600'>
          Sarkari Mock Test
        </Link>
        <div className='flex items-center space-x-4'>
          <Link href='/' className='text-gray-600 hover:text-blue-600'>
            Home
          </Link>
          <Link href='/blog' className='text-gray-600 hover:text-blue-600'>
            Blog
          </Link>
          <Link href='/contact' className='text-gray-600 hover:text-blue-600'>
            Contact
          </Link>

          {loading ? null : !user ? (
            <button
              onClick={handleSignIn}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
            >
              Admin
            </button>
          ) : (
            <Fragment>
              <Link
                href='/dashboard'
                className='text-gray-600 hover:text-blue-600'
              >
                Dashboard
              </Link>
              {user.email === adminEmail && (
                <Link
                  href='/admin/blog'
                  className='font-bold text-red-600 hover:text-red-700'
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700'
              >
                Logout
              </button>
            </Fragment>
          )}
        </div>
      </div>
    </nav>
  );
}
