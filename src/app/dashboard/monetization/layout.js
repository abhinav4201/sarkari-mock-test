// src/app/dashboard/monetization/layout.js

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutGrid, BarChartHorizontalBig } from "lucide-react";

const subNavLinks = [
  {
    name: "Monetization Hub",
    href: "/dashboard/monetization",
    icon: LayoutGrid,
  },
  {
    name: "My Content Analytics",
    href: "/dashboard/monetization/analytics",
    icon: BarChartHorizontalBig,
  },
];

export default function MonetizationLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className='bg-slate-100 min-h-screen'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Sub-navigation Header */}
        <div className='bg-white p-4 rounded-xl shadow-md border mb-8'>
          <div className='flex flex-col sm:flex-row justify-between items-center gap-4'>
            <div className='flex items-center gap-2'>
              {subNavLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
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

        {/* This will render the specific page (Hub, Analytics, or Test Management) */}
        <main>{children}</main>
      </div>
    </div>
  );
}
