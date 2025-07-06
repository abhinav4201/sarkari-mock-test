"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import ConfirmationModal from "../ui/ConfirmationModal";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  doc,
  deleteDoc,
  where,
  Timestamp,
} from "firebase/firestore";

const PAGE_SIZE = 10;

// Helper function to format dates for input fields
const formatDateForInput = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `0${d.getMonth() + 1}`.slice(-2);
  const day = `0${d.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
};

export default function ContactList() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for pagination
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // State for date filters, now defaulting to today
  const [startDate, setStartDate] = useState(formatDateForInput(new Date()));
  const [endDate, setEndDate] = useState(formatDateForInput(new Date()));

  // State for delete modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // This function now handles all data fetching with filters
  const fetchContacts = useCallback(async (initialLoad = false) => {
    if (!hasMore && !initialLoad) return;

    if (initialLoad) {
      setLoading(true);
      setContacts([]); // Clear previous results on new filter search
    } else {
      setLoadingMore(true);
    }

    try {
      const contactsRef = collection(db, "contacts");
      const queryConstraints = [
        orderBy("submittedAt", "desc"),
        limit(PAGE_SIZE),
      ];

      // Add date filters to the query
      if (startDate) {
        const start = Timestamp.fromDate(new Date(new Date(startDate).setHours(0, 0, 0, 0)));
        queryConstraints.push(where("submittedAt", ">=", start));
      }
      if (endDate) {
        const end = Timestamp.fromDate(new Date(new Date(endDate).setHours(23, 59, 59, 999)));
        queryConstraints.push(where("submittedAt", "<=", end));
      }
      
      // Add pagination cursor if it's not an initial load
      if (!initialLoad && lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }

      const q = query(contactsRef, ...queryConstraints);
      const snapshot = await getDocs(q);
      const newContacts = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt.toMillis(),
        };
      });

      setContacts((prev) =>
        initialLoad ? newContacts : [...prev, ...newContacts]
      );
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(newContacts.length === PAGE_SIZE);
    } catch (error) {
      toast.error("Failed to load contacts.");
      console.error("Failed to load contacts", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [startDate, endDate, lastDoc, hasMore]);


  // Re-fetch when date filters are applied by the user
  useEffect(() => {
    setHasMore(true); // Reset pagination state before fetching
    setLastDoc(null);
    fetchContacts(true); // Perform an initial load with the new filters
  }, [startDate, endDate]);


  const handleDownloadCsv = () => {
    if (contacts.length === 0) {
      toast.error("No data to download for the selected criteria.");
      return;
    }

    const headers = ["Name", "Email", "Message", "Date Submitted"];
    const csvRows = [
      headers.join(","),
      ...contacts.map((row) =>
        [
          `"${(row.name || "").replace(/"/g, '""')}"`,
          `"${(row.email || "").replace(/"/g, '""')}"`,
          `"${(row.message || "").replace(/"/g, '""')}"`,
          `"${new Date(row.submittedAt).toLocaleString()}"`,
        ].join(",")
      ),
    ];

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `contacts_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = (contactId) => {
    setDeletingContactId(contactId);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
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

  if (loading) {
    return <div className='text-center p-8'>Loading submissions for today...</div>;
  }
  return (
    <div>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title='Delete Submission'
        message='Are you sure you want to permanently delete this submission?'
        confirmText='Delete'
        isLoading={isDeleting}
      />

      <div className='p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end'>
          <div>
            <label
              htmlFor='startDate'
              className='block text-sm font-medium text-slate-800 mb-1'
            >
              Start Date
            </label>
            <input
              type='date'
              id='startDate'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className='w-full p-2 border text-slate-900 border-slate-300 rounded-lg'
            />
          </div>
          <div>
            <label
              htmlFor='endDate'
              className='block text-sm font-medium text-slate-800 mb-1'
            >
              End Date
            </label>
            <input
              type='date'
              id='endDate'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className='w-full p-2 border text-slate-900 border-slate-300 rounded-lg'
            />
          </div>
          <div>
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className='w-full px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300'
            >
              Clear Filters
            </button>
          </div>
          <div>
            <button
              onClick={handleDownloadCsv}
              className='w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700'
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>

      <div className='bg-white p-4 sm:p-6 rounded-2xl shadow-lg'>
        <div className='hidden md:block'>
          <table className='w-full text-left'>
            <thead className='bg-slate-50'>
              <tr>
                <th className='p-4 font-bold text-slate-900'>Name</th>
                <th className='p-4 font-bold text-slate-900'>Email</th>
                <th className='p-4 font-bold text-slate-900'>Message</th>
                <th className='p-4 font-bold text-slate-900'>Date</th>
                <th className='p-4 font-bold text-slate-900'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className='border-b border-slate-100'>
                  <td className='p-4 text-slate-800 align-top'>
                    {contact.name}
                  </td>
                  <td className='p-4 text-slate-800 align-top'>
                    {contact.email}
                  </td>
                  <td className='p-4 text-slate-700 max-w-sm align-top'>
                    {contact.message}
                  </td>
                  <td className='p-4 text-slate-600 align-top'>
                    {new Date(contact.submittedAt).toLocaleString()}
                  </td>
                  <td className='p-4 align-top'>
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
        {contacts.length === 0 && !loading && (
          <p className='text-center p-8 text-slate-700'>
            No submissions found for the selected criteria.
          </p>
        )}

        {hasMore && (
          <div className='text-center pt-6 mt-6 border-t border-slate-200'>
            <button
              onClick={() => fetchContacts(false)}
              disabled={loadingMore}
              className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50'
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}