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
    <div className='bg-gray-800 text-white w-64 p-4 space-y-2'>
      <h2 className='text-xl font-bold mb-4'>Admin Panel</h2>
      {adminLinks.map((link) => (
        <Link
          key={link.name}
          href={link.href}
          className={`block p-2 rounded ${
            pathname === link.href ? "bg-blue-600" : "hover:bg-gray-700"
          }`}
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
}