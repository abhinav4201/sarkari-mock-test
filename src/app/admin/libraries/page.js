// src/app/admin/libraries/page.js

"use client";

import LibraryQRCodeModal from "@/components/admin/LibraryQRCodeModal";
import LibraryOwnerLinkModal from "@/components/admin/LibraryOwnerLinkModal"; // NEW: Import the new modal
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  doc, // NEW: Import doc for updates
  updateDoc, // NEW: Import updateDoc for updates
} from "firebase/firestore";
import { Edit, QrCode, X, BarChart, UserCog } from "lucide-react"; // Import BarChart and UserCog
import Link from "next/link"; // Import Link
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LibrariesPage() {
  const { user } = useAuth();
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for pagination
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // State for the form (Add & Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [currentLibrary, setCurrentLibrary] = useState(null);
  const [libraryName, setLibraryName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [commission, setCommission] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthlyTestLimit, setMonthlyTestLimit] = useState(10);

  // State for the QR Code Modal (Student)
  const [isStudentQrModalOpen, setIsStudentQrModalOpen] = useState(false);
  const [selectedLibraryForStudentQr, setSelectedLibraryForStudentQr] =
    useState(null);

  // NEW: State for the Owner Link Modal
  const [isOwnerLinkModalOpen, setIsOwnerLinkModalOpen] = useState(false);
  const [selectedLibraryForOwnerLink, setSelectedLibraryForOwnerLink] =
    useState(null);

  const fetchLibraries = useCallback(
    async (loadMore = false) => {
      if (loadMore) {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const q = query(
          collection(db, "libraries"),
          orderBy("createdAt", "desc"),
          ...(loadMore && lastDoc ? [startAfter(lastDoc)] : []),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const newLibraries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setHasMore(newLibraries.length === 5);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setLibraries((prev) =>
          loadMore ? [...prev, ...newLibraries] : newLibraries
        );
      } catch (error) {
        toast.error("Failed to load libraries.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [lastDoc, hasMore, loadingMore]
  );

  useEffect(() => {
    fetchLibraries();
  }, []);

  const handlePhoneChange = (e) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    setContactPhone(numericValue.slice(0, 10));
  };

  const handleEditClick = (library) => {
    setIsEditing(true);
    setCurrentLibrary(library);
    setLibraryName(library.libraryName);
    setContactEmail(library.contactEmail);
    setContactPhone(library.contactPhone || "");
    setCommission(library.commissionPerTest);
    setMonthlyTestLimit(library.monthlyTestLimit || 10);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setCurrentLibrary(null);
    setLibraryName("");
    setContactEmail("");
    setContactPhone("");
    setCommission(5);
    setMonthlyTestLimit(10);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Admin not logged in.");

    if (contactPhone.length !== 10) {
      return toast.error("Phone number must be exactly 10 digits.");
    }
    setIsSubmitting(true);

    const apiEndpoint = isEditing
      ? `/api/admin/libraries/${currentLibrary.id}`
      : "/api/admin/libraries";

    const method = isEditing ? "PUT" : "POST";

    try {
      const idToken = await user.getIdToken();
      const res = await fetch(apiEndpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          libraryName: libraryName,
          contactEmail: contactEmail,
          commissionPerTest: commission,
          contactPhone,
          monthlyTestLimit: Number(monthlyTestLimit),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(`Library ${isEditing ? "updated" : "added"} successfully!`);
      cancelEdit();
      fetchLibraries();
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openStudentQrModal = (library) => {
    setSelectedLibraryForStudentQr(library);
    setIsStudentQrModalOpen(true);
  };

  // NEW: Function to open the owner link modal
  const openOwnerLinkModal = (library) => {
    setSelectedLibraryForOwnerLink(library);
    setIsOwnerLinkModalOpen(true);
  };

  return (
    <>
      <LibraryQRCodeModal
        isOpen={isStudentQrModalOpen}
        onClose={() => setIsStudentQrModalOpen(false)}
        library={selectedLibraryForStudentQr}
      />
      {/* NEW: Render the LibraryOwnerLinkModal */}
      <LibraryOwnerLinkModal
        isOpen={isOwnerLinkModalOpen}
        onClose={() => setIsOwnerLinkModalOpen(false)}
        library={selectedLibraryForOwnerLink}
      />
      <div>
        <h1 className='text-3xl font-bold text-slate-900 mb-6'>
          Library Partner Management
        </h1>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
          <div className='lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border'>
            <h2 className='text-xl font-bold text-slate-800 mb-4'>
              {isEditing ? "Edit Library" : "Add New Library"}
            </h2>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  Library Name
                </label>
                <input
                  type='text'
                  value={libraryName}
                  onChange={(e) => setLibraryName(e.target.value)}
                  className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  Contact Email
                </label>
                <input
                  type='email'
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  Contact Phone (10 digits)
                </label>
                <input
                  type='tel'
                  value={contactPhone}
                  onChange={handlePhoneChange}
                  className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                  placeholder='Enter 10-digit phone number'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  Commission per Test (₹)
                </label>
                <input
                  type='number'
                  value={commission}
                  onChange={(e) => setCommission(Number(e.target.value))}
                  className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  Monthly Test Limit per Student
                </label>
                <input
                  type='number'
                  value={monthlyTestLimit}
                  onChange={(e) => setMonthlyTestLimit(e.target.value)}
                  className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                  required
                  min='0'
                />
              </div>
              <div className='flex gap-2'>
                {isEditing && (
                  <button
                    type='button'
                    onClick={cancelEdit}
                    className='w-full px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg flex items-center justify-center gap-1'
                  >
                    <X size={16} /> Cancel
                  </button>
                )}
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700'
                >
                  {isSubmitting
                    ? "Saving..."
                    : isEditing
                    ? "Update Library"
                    : "Add Library"}
                </button>
              </div>
            </form>
          </div>

          <div className='lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border'>
            <h2 className='text-xl font-bold text-slate-800 mb-4'>
              Partner Libraries
            </h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className='space-y-3'>
                {libraries.map((lib) => (
                  <div
                    key={lib.id}
                    className='p-3 border rounded-lg flex justify-between items-center'
                  >
                    <div>
                      <p className='font-semibold text-slate-800'>
                        {lib.libraryName}
                      </p>
                      <p className='text-sm text-slate-500'>
                        {lib.contactEmail} | {lib.contactPhone} - ₹
                        {lib.commissionPerTest}/test
                      </p>
                      <p className='text-sm text-slate-500'>
                        {lib.monthlyTestLimit || "No"}{" "}
                        limit
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      {/* New button for analytics */}
                      <Link
                        href={`/admin/libraries/analytics/${lib.id}`}
                        className='p-2 text-slate-600 hover:bg-slate-100 rounded-md'
                        title='View Analytics'
                      >
                        <BarChart size={18} />
                      </Link>
                      {/* NEW: Button to open owner link modal */}
                      <button
                        onClick={() => openOwnerLinkModal(lib)}
                        className='p-2 text-slate-600 hover:bg-slate-100 rounded-md'
                        title='Generate Owner Link'
                      >
                        <UserCog size={18} />
                      </button>
                      <button
                        onClick={() => openStudentQrModal(lib)}
                        className='p-2 text-slate-600 hover:bg-slate-100 rounded-md'
                        title='Show Student QR Code'
                      >
                        <QrCode size={18} />
                      </button>
                      <button
                        onClick={() => handleEditClick(lib)}
                        className='p-2 text-slate-600 hover:bg-slate-100 rounded-md'
                        title='Edit'
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <div className='text-center mt-6'>
                    <button
                      onClick={() => fetchLibraries(true)}
                      disabled={loadingMore}
                      className='px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200'
                    >
                      {loadingMore ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
