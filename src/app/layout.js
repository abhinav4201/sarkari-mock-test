"use client"; // This needs to be a client component to use the pathname hook

import "./globals.css";
import { Inter } from "next/font/google";
import { AuthContextProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { usePathname } from "next/navigation"; // Import the hook

const inter = Inter({ subsets: ["latin"] });

// We can't export metadata from a client component,
// so we'll rely on page-level metadata or move this to a separate server component if needed.

export default function RootLayout({ children }) {
  const pathname = usePathname(); // Get the current URL path
  const isAdminPage = pathname.startsWith("/admin"); // Check if it's an admin page

  return (
    <html lang='en'>
      <body className={inter.className}>
        <AuthContextProvider>
          <Toaster position='bottom-center' />

          {/* THE FIX: Only show the Navbar if it's NOT an admin page */}
          {!isAdminPage && <Navbar />}

          <main>{children}</main>

          {/* Also hide the Footer on admin pages for a cleaner interface */}
          {!isAdminPage && <Footer />}
        </AuthContextProvider>
      </body>
    </html>
  );
}
