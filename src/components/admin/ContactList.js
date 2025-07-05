"use client";

import { db } from "@/lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { useState } from "react";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

export default function ContactList({ initialContacts }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [hasMore, setHasMore] = useState(initialContacts.length === PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMoreContacts = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);

    try {
      const lastContact = contacts[contacts.length - 1];
      const cursor = lastContact ? lastContact.submittedAt : "";

      const res = await fetch(`/api/admin/contacts?cursor=${cursor}`);
      const newContacts = await res.json();

      if (Array.isArray(newContacts)) {
        setContacts((prev) => [...prev, ...newContacts]);
        if (newContacts.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more contacts", error);
    } finally {
      setLoadingMore(false);
    }
  };
  const handleDeleteClick = (contactId) => {
    setDeletingContactId(contactId);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete the document directly from the client
      await deleteDoc(doc(db, "contacts", deletingContactId));

      toast.success("Contact submission deleted!");
      setContacts((prev) => prev.filter((c) => c.id !== deletingContactId));
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsConfirmModalOpen(false);
      setDeletingContactId(null);
      setIsDeleting(false);
    }
  };

  return (
    <div className='bg-white p-4 sm:p-6 rounded-2xl shadow-lg'>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title='Delete Submission'
        message='Are you sure you want to permanently delete this contact submission?'
        confirmText='Delete'
        isLoading={isDeleting}
      />
      {contacts.length > 0 ? (
        <>
          {/* On medium screens and up, use a table */}
          <div className='hidden md:block'>
            <table className='w-full text-left'>
              <thead className='bg-slate-50'>
                <tr>
                  <th className='p-4 font-bold text-slate-800'>Name</th>
                  <th className='p-4 font-bold text-slate-800'>Email</th>
                  <th className='p-4 font-bold text-slate-800'>Message</th>
                  <th className='p-4 font-bold text-slate-800'>Date</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className='border-b border-slate-100'>
                    <td className='p-4 text-slate-800'>{contact.name}</td>
                    <td className='p-4 text-slate-800'>{contact.email}</td>
                    <td className='p-4 text-slate-700 max-w-sm truncate'>
                      {contact.message}
                    </td>
                    <td className='p-4 text-slate-600'>
                      {new Date(contact.submittedAt).toLocaleString()}
                    </td>
                    <td className='p-4'>
                      <button
                        onClick={() => handleDeleteClick(contact.id)}
                        className='text-sm font-medium text-red-600 hover:text-red-800'
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* On mobile, use a list of cards */}
          <div className='md:hidden space-y-4'>
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className='p-4 border border-slate-200 rounded-lg bg-slate-50'
              >
                <p className='font-bold text-slate-900'>{contact.name}</p>
                <p className='text-sm text-indigo-600'>{contact.email}</p>
                <p className='mt-2 text-sm text-slate-600'>
                  {new Date(contact.submittedAt).toLocaleString()}
                </p>
                <p className='mt-4 p-3 bg-white border rounded text-slate-800'>
                  {contact.message}
                </p>
                <div className='mt-4'>
                  <button
                    onClick={() => handleDeleteClick(contact.id)}
                    className='text-sm font-medium text-red-600 hover:text-red-800'
                  >
                    Delete Submission
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className='text-center p-8 text-slate-600'>
          No contact submissions found.
        </p>
      )}

      {hasMore && (
        <div className='text-center pt-6 mt-6 border-t border-slate-200'>
          <button
            onClick={loadMoreContacts}
            disabled={loadingMore}
            className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50'
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
