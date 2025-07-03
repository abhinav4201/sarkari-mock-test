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

      <div className='bg-white p-4 sm:p-6 rounded-2xl shadow-lg'>
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
                  <td className='p-4 text-slate-600'>{contact.submittedAt}</td>
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
                {contact.submittedAt}
              </p>
              <p className='mt-4 p-3 bg-white border rounded text-slate-800'>
                {contact.message}
              </p>
            </div>
          ))}
        </div>

        {contacts.length === 0 && (
          <p className='text-center p-8 text-slate-600'>
            No contact submissions found.
          </p>
        )}
      </div>
    </div>
  );

}
