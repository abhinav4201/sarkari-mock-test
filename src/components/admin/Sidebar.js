// components/admin/Sidebar.js
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  LayoutDashboard,
  PenSquare,
  TestTube,
  FileClock,
  Mail,
  KeyRound,
  BookOpenText,
  Image,
} from "lucide-react"; // Added relevant icons

const adminLinks = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className='mr-3 h-5 w-5' />,
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
  // --- NEW ITEM ADDED FOR QUESTION BANK ---
  {
    name: "Question Bank",
    href: "/admin/question-bank",
    icon: <BookOpenText className='mr-3 h-5 w-5' />,
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
    name: "SVG : Converter",
    href: "/admin/svg-converter",
    icon: <Image className='mr-3 h-5 w-5' />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className='bg-slate-900 text-slate-300 w-64 p-4 flex flex-col h-full'>
      <div className='hidden md:flex items-center mb-6 flex-shrink-0'>
        <Link
          href='/admin'
          className='text-xl font-bold text-white flex items-center gap-2'
        >
          <svg
            className='h-8 w-8 text-indigo-400'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0h9.75m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75'
            />
          </svg>
          <span>Admin Panel</span>
        </Link>
      </div>

      <nav className='flex-grow pt-12 md:pt-0'>
        {adminLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={`flex items-center p-3 rounded-lg font-medium mb-2 transition-colors ${
              pathname === link.href
                ? "bg-indigo-600 text-white"
                : "hover:bg-slate-800 hover:text-white"
            }`}
          >
            {link.icon}
            {link.name}
          </Link>
        ))}
      </nav>

      <div className='mt-6 pt-4 border-t border-slate-700'>
        {user && (
          <div className='px-3 py-2 mb-2 text-center'>
            <p className='text-sm font-medium text-white truncate'>
              {user.displayName}
            </p>
            <p className='text-xs text-slate-400 truncate'>{user.email}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className='w-full flex items-center p-3 rounded-lg font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors'
        >
          <LogOut className='mr-3 h-5 w-5' />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
