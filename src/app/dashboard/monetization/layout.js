// src/app/dashboard/monetization/layout.js

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  LayoutGrid,
  BarChartHorizontalBig,
  Wallet,
} from "lucide-react"; // Import Wallet icon

const subNavLinks = [
  { name: "Creator Hub", href: "/dashboard/monetization", icon: LayoutGrid },
  {
    name: "My Analytics",
    href: "/dashboard/monetization/analytics",
    icon: BarChartHorizontalBig,
  },
  // --- NEW LINK ADDED ---
  {
    name: "Payouts & Earnings",
    href: "/dashboard/monetization/payouts",
    icon: Wallet,
  },
];

export default function MonetizationLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className='bg-slate-100 min-h-screen'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-white p-4 rounded-xl shadow-md border mb-8'>
          <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
            <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center'>
              {subNavLinks.map((link) => {
                // This logic correctly highlights parent paths as well
                const isActive =
                  pathname.startsWith(link.href) &&
                  (link.href !== "/dashboard/monetization" ||
                    pathname === "/dashboard/monetization");
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <link.icon size={16} />
                    {link.name}
                  </Link>
                );
              })}
            </div>
            <Link
              href='/dashboard'
              className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900'
            >
              <ArrowLeft size={16} />
              Back to Main Dashboard
            </Link>
          </div>
        </div>

        <main>{children}</main>
      </div>
    </div>
  );
}
