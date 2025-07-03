"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { name: "Dashboard", href: "/admin" },
  { name: "Blog Management", href: "/admin/blog" },
  { name: "Mock Tests", href: "/admin/mock-tests" }, // Renamed for clarity
  { name: "Daily Content", href: "/admin/daily-content" }, // <-- ADD THIS LINE
  { name: "Contact Submissions", href: "/admin/contacts" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <div className="bg-slate-900 text-slate-300 w-64 p-4 flex flex-col h-full">
      <div className="flex items-center mb-6 flex-shrink-0">
        <Link href="/admin" className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
            <span>Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-grow">
        {adminLinks.map((link) => (
            <Link
            key={link.name}
            href={link.href}
            className={`block p-3 rounded-lg font-medium mb-2 transition-colors ${
                pathname === link.href ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
            }`}
            >
            {link.name}
            </Link>
        ))}
      </nav>
    </div>
  );
}