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
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (
      !authLoading &&
      userProfile?.role === "library-owner" &&
      userProfile.libraryOwnerOf?.length > 0
    ) {
      const targetPath = `/library-owner/${userProfile.libraryOwnerOf[0]}`;
      if (pathname !== targetPath) {
        router.push(targetPath);
      }
    }
  }, [authLoading, userProfile, router, pathname]);

  let layoutContent;

  if (authLoading) {
    layoutContent = (
      <div className='flex justify-center items-center h-screen bg-slate-100'>
        <p className='text-lg font-medium text-slate-700'>Loading...</p>
      </div>
    );
  } else {
    const isAdminPage = pathname.startsWith("/admin");
    const isLibraryPage =
      userProfile?.role === "library-student" ||
      userProfile?.role === "library-owner";

    if (isAdminPage) {
      layoutContent = <main>{children}</main>;
    } else if (isLibraryPage) {
      layoutContent = (
        <>
          <LibraryNavbar />
          <main>{children}</main>
          <Footer />
        </>
      );
    } else {
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
