// src/app/layout.js
"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { AuthContextProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { usePathname, useRouter } from "next/navigation";
import LoginPromptModal from "@/components/ui/LoginPromptModal";
import LibraryNavbar from "@/components/LibraryNavbar";
import { useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

function AppLayout({ children }) {
  const pathname = usePathname();
  const {
    user,
    isLibraryUser,
    isLibraryOwner,
    ownedLibraryIds,
    loading: authLoading,
  } = useAuth();
  const router = useRouter();

  // Redirect logic for library owners
  useEffect(() => {
    // Only attempt redirection if authentication has finished loading
    // and the user is a library owner with at least one owned library.
    // Ensure this doesn't cause a redirect loop if already on the target page.
    if (!authLoading && isLibraryOwner && ownedLibraryIds.length > 0) {
      const targetPath = `/library-owner/${ownedLibraryIds[0]}`;
      if (pathname !== targetPath) {
        router.push(targetPath);
      }
    }
  }, [authLoading, isLibraryOwner, ownedLibraryIds, router, pathname]); // Added pathname to dependencies

  let layoutContent;

  if (authLoading) {
    layoutContent = (
      <div className='flex justify-center items-center h-screen bg-slate-100'>
        <p className='text-lg font-medium text-slate-700'>Loading...</p>
      </div>
    );
  } else {
    const isAdminPage = pathname.startsWith("/admin");
    const isLibraryOwnerPage = pathname.startsWith("/library-owner"); // NEW: Check for library owner page

    // Don't render any default navbar/footer for admin pages
    if (isAdminPage) {
      layoutContent = <main>{children}</main>;
    }
    // If the user is a library user (student) OR a library owner, show the dedicated library navbar
    // The library owner page will use LibraryNavbar.
    else if (isLibraryUser || isLibraryOwnerPage) {
      // Updated condition
      layoutContent = (
        <>
          <LibraryNavbar />
          <main>{children}</main>
          <Footer />
        </>
      );
    }
    // Otherwise, show the default public navbar and footer
    else {
      layoutContent = (
        <>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </>
      );
    }
  }

  return <>{layoutContent}</>;
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
