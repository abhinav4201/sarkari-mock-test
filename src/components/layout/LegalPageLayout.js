import React from "react";

// A simple layout for styling legal documents consistently.
export default function LegalPageLayout({ title, children }) {
  return (
    <div className='bg-slate-50 min-h-screen'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24'>
        <div className='max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200'>
          <h1 className='text-3xl md:text-4xl font-extrabold text-slate-900 mb-8 border-b pb-4'>
            {title}
          </h1>
          {/* The 'prose' class from Tailwind CSS provides excellent default typography for long-form text. */}
          <div className='prose prose-lg max-w-none prose-h2:font-bold prose-h2:text-slate-800 prose-a:text-indigo-600 hover:prose-a:text-indigo-800'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
