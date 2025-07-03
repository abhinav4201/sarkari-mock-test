import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

async function getContacts() {
  const contactsRef = collection(db, "contacts");
  const q = query(contactsRef, orderBy("submittedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    submittedAt: doc.data().submittedAt.toDate().toLocaleString(),
  }));
}

export default async function ContactsPage() {
  const contacts = await getContacts();

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Contact Submissions</h1>
        <a
          href='/api/admin/download/contacts'
          download
          className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
        >
          Download as CSV
        </a>
      </div>
      {/* We will add date filtering later */}
      <div className='bg-white p-4 rounded-lg shadow-md'>
        {/* Table to display contacts */}
        <table className='w-full'>
          {/* Table Head */}
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td className='p-2 border-b'>{contact.name}</td>
                <td className='p-2 border-b'>{contact.email}</td>
                <td className='p-2 border-b'>{contact.message}</td>
                <td className='p-2 border-b'>{contact.submittedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
