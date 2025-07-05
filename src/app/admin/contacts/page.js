"use client"; // This converts the page to a Client Component

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import ContactList from "@/components/admin/ContactList";

// Helper function to fetch the initial batch of contacts
async function getInitialContacts() {
  const contactsRef = collection(db, "contacts");
  const q = query(contactsRef, orderBy("submittedAt", "desc"), limit(10));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      submittedAt: data.submittedAt ? data.submittedAt.toMillis() : null,
    };
  });
}

export default function ContactsPage() {
  // State to hold the contacts and loading status
  const [initialContacts, setInitialContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use a useCallback to memoize the data fetching function
  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const contacts = await getInitialContacts();
      setInitialContacts(contacts);
    } catch (error) {
      console.error("Failed to load contacts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on the client side when the component mounts
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  return (
    <div>
      <div className='flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4'>
        <h1 className='text-3xl font-bold text-slate-900'>
          Contact Submissions
        </h1>
        <a
          href='/api/admin/download/contacts'
          download
          className='px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-center'
        >
          Download as CSV
        </a>
      </div>

      {/* Conditionally render the list or a loading message */}
      {loading ? (
        <div className='text-center p-8'>Loading contacts...</div>
      ) : (
        <ContactList initialContacts={initialContacts} />
      )}
    </div>
  );
}
