"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { AuthContextProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { usePathname } from "next/navigation";
import LoginPromptModal from "@/components/ui/LoginPromptModal";
import LibraryNavbar from "@/components/LibraryNavbar";

const inter = Inter({ subsets: ["latin"] });

function AppLayout({ children }) {
  const pathname = usePathname();
  // --- THIS IS THE FIX ---
  // We now get the correct, robustly-calculated booleans directly from the context
  const { isLibraryUser, isLibraryOwner, loading: authLoading } = useAuth();
  // --- END OF FIX ---

  if (authLoading) {
    return (
      <div className='flex justify-center items-center h-screen bg-slate-100'>
        <p className='text-lg font-medium text-slate-700'>Loading...</p>
      </div>
    );
  }

  const isAdminPage = pathname.startsWith("/admin");

  // The logic here is now much cleaner and uses the correct state
  if (isAdminPage) {
    return <main>{children}</main>;
  }

  if (isLibraryUser || isLibraryOwner) {
    return (
      <>
        <LibraryNavbar />
        <main>{children}</main>
        <Footer />
      </>
    );
  }

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
          <AppLayout>{children}</AppLayout>
        </AuthContextProvider>
      </body>
    </html>
  );
}
