"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { AuthContextProvider, useAuth } from "@/context/AuthContext"; // Import useAuth
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { usePathname } from "next/navigation";
import LoginPromptModal from "@/components/ui/LoginPromptModal";
import LibraryNavbar from "@/components/LibraryNavbar"; // Import the LibraryNavbar

const inter = Inter({ subsets: ["latin"] });

// This new component contains the logic for choosing the correct layout
function AppLayout({ children }) {
  const pathname = usePathname();
  const { isLibraryUser, loading: authLoading } = useAuth(); // Get the user type and loading state

  // --- THIS IS THE FIX ---
  // While authentication is loading, show a full-page loader to prevent rendering the wrong navbar.
  if (authLoading) {
    return (
      <div className='flex justify-center items-center h-screen bg-slate-100'>
        <p className='text-lg font-medium text-slate-700'>Loading...</p>
      </div>
    );
  }
  // --- END OF FIX ---

  // Determine which layout to show based on user type and path
  const isAdminPage = pathname.startsWith("/admin");

  // Don't render any default navbar/footer for admin pages
  if (isAdminPage) {
    return <main>{children}</main>;
  }

  // If the user is a library user, show the dedicated library navbar
  if (isLibraryUser) {
    return (
      <>
        <LibraryNavbar />
        <main>{children}</main>
        <Footer />
      </>
    );
  }

  // Otherwise, show the default public navbar and footer
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <AuthContextProvider>
          <Toaster position='top-center' reverseOrder={false} />
          <LoginPromptModal />
          {/* The new AppLayout component now handles all the conditional logic */}
          <AppLayout>{children}</AppLayout>
        </AuthContextProvider>
      </body>
    </html>
  );
}
