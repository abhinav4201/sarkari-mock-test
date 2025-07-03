export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className='bg-gray-800 text-white py-6'>
      <div className='container mx-auto px-6 text-center'>
        <p>&copy; {currentYear} Sarkari Mock Test. All Rights Reserved.</p>
        <div className='mt-2'>
          <a href='#' className='px-2 hover:text-blue-400'>
            Privacy Policy
          </a>
          <span className='px-1'>|</span>
          <a href='#' className='px-2 hover:text-blue-400'>
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
