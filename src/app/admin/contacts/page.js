import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import ContactList from "@/components/admin/ContactList";

// This function now only fetches the FIRST page of contacts on the server
async function getInitialContacts() {
  const contactsRef = collection(db, "contacts");
  const q = query(contactsRef, orderBy("submittedAt", "desc"), limit(10));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convert timestamp to a serializable format
      submittedAt: data.submittedAt ? data.submittedAt.toMillis() : null,
    };
  });
}

export default async function ContactsPage() {
  const initialContacts = await getInitialContacts();

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

      <ContactList initialContacts={initialContacts} />
    </div>
  );
}
