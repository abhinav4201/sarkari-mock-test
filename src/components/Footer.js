import Link from "next/link"; // Import the Link component

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className='bg-slate-800 text-slate-300 py-8'>
      <div className='container mx-auto px-6 text-center'>
        <p>&copy; {currentYear} Sarkari Mock Test. All Rights Reserved.</p>
        <div className='mt-4 flex justify-center items-center space-x-2 text-sm'>
          {/* FIX: Use Link component for internal navigation */}
          <Link
            href='/privacy-policy'
            className='px-3 py-1 hover:text-white hover:underline'
          >
            Privacy Policy
          </Link>
          <span className='text-slate-500'>|</span>
          <Link
            href='/terms-of-service'
            className='px-3 py-1 hover:text-white hover:underline'
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
