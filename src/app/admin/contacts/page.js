"use client";

import ContactList from "@/components/admin/ContactList";

export default function ContactsPage() {
  return (
    <div>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-slate-900'>
          Contact Submissions
        </h1>
        <p className='mt-1 text-slate-700'>
          View, filter, and download contact form submissions.
        </p>
      </div>

      <ContactList />
    </div>
  );
}
