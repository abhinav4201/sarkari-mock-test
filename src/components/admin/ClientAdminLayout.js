// components/ClientAdminLayout.js
"use client";
import Sidebar from "@/components/admin/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AdminMobileNav from "./AdminMobileNav";

import {
  Banknote,
  BookOpenText,
  DollarSign,
  FileClock,
  Image,
  KeyRound,
  LayoutDashboard,
  Library,
  LineChart,
  Mail,
  PenSquare,
  TestTube,
  BookUser, // NEW: Icon for User Questions
  Map,
  Trophy,
} from "lucide-react";

const adminLinks = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className='mr-3 h-5 w-5' />,
  },
  {
    name: "Exam Adventures",
    href: "/admin/adventures",
    icon: <Map className='mr-3 h-5 w-5' />,
  },
  {
    name: "Library Partners",
    href: "/admin/libraries",
    icon: <Library className='mr-3 h-5 w-5' />,
  },
  {
    name: "Live Pool Tests",
    href: "/admin/live-tests",
    icon: <Trophy className='mr-3 h-5 w-5' />,
  },
  {
    name: "Blog Management",
    href: "/admin/blog",
    icon: <PenSquare className='mr-3 h-5 w-5' />,
  },
  {
    name: "Mock Tests",
    href: "/admin/mock-tests",
    icon: <TestTube className='mr-3 h-5 w-5' />,
  },
  {
    name: "Question Bank",
    href: "/admin/question-bank",
    icon: <BookOpenText className='mr-3 h-5 w-5' />,
  },
  {
    name: "User Questions Review", // NEW: Entry for user question review
    href: "/admin/question-review",
    icon: <BookUser className='mr-3 h-5 w-5' />,
  },
  {
    name: "Daily Content",
    href: "/admin/daily-content",
    icon: <FileClock className='mr-3 h-5 w-5' />,
  },
  {
    name: "Contact Submissions",
    href: "/admin/contacts",
    icon: <Mail className='mr-3 h-5 w-5' />,
  },
  {
    name: "Access Control",
    href: "/admin/access-control",
    icon: <KeyRound className='mr-3 h-5 w-5' />,
  },
  {
    name: "Creator Analytics",
    href: "/admin/analytics",
    icon: <LineChart className='mr-3 h-5 w-5' />,
  },
  {
    name: "Monetization Requests",
    href: "/admin/monetization-requests",
    icon: <DollarSign className='mr-3 h-5 w-5' />,
  },
  {
    name: "Manage Payouts",
    href: "/admin/payouts",
    icon: <Banknote className='mr-3 h-5 w-5' />,
  },
  {
    name: "SVG : Converter",
    href: "/admin/svg-converter",
    icon: <Image className='mr-3 h-5 w-5' />,
  },
];

export default function ClientAdminLayout({ children }) {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    setMobileMenuOpen(false);
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
      <>
        <div className='flex min-h-screen bg-slate-100'>
          {/* Desktop Sidebar: Visible only on md and larger screens */}
          <div className='hidden md:block'>
            <Sidebar adminLinks={adminLinks} />
          </div>

          {/* Mobile Header */}
          <header className='md:hidden bg-white shadow-md p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-10'>
            <Link href='/admin' className='font-bold text-indigo-600'>
              Admin Panel
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className='p-2 rounded-md hover:bg-slate-100 text-slate-800'
            >
              <Menu className='h-6 w-6' />
            </button>
          </header>

          {/* Main Content Area */}
          <main className='flex-1 p-4 sm:p-6 lg:p-8 pt-20 md:pt-8'>
            {children}
          </main>
        </div>

        {/* Mobile Navigation Modal */}
        <AdminMobileNav
          adminLinks={adminLinks}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </>
    );
  }

  // If not an admin, show Access Denied
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
