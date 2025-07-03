import "./globals.css";
import { Inter } from "next/font/google";
import { AuthContextProvider } from "@/context/AuthContext"; // <-- Import
import Navbar from "@/components/Navbar"; // Assuming you have this
import Footer from "@/components/Footer"; // Assuming you have this

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sarkari Mock Test",
  description: "Your one-stop destination for mock tests.",
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <AuthContextProvider>
          {" "}
          {/* <-- Wrap here */}
          <Navbar />
          {children}
          <Footer />
        </AuthContextProvider>
      </body>
    </html>
  );
}
