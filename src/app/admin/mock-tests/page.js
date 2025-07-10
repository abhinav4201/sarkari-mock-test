"use client";

import { useState, useEffect, useCallback } from "react";
import MockTestManager from "@/components/admin/MockTestManager";
import EditTestModal from "@/components/admin/EditTestModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  startAfter,
  writeBatch,
  where,
  doc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import Link from "next/link";
import { Plus, Settings, Edit, Trash2 } from "lucide-react";

const PAGE_SIZE = 10;
const toSentenceCase = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function AdminMockTestsPage() {
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // --- NEW: State to manage the Edit and Delete modals ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Your original fetchTests and handleTestCreated functions are preserved
  const fetchTests = useCallback(
    async (loadMore = false) => {
      if (!loadMore) {
        setIsLoading(true);
        setTests([]);
        setLastDoc(null);
        setHasMore(true);
      } else {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
      }
      try {
        const queryConstraints = [
          collection(db, "mockTests"),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE),
        ];
        if (loadMore && lastDoc) {
          queryConstraints.push(startAfter(lastDoc));
        }
        const q = query(...queryConstraints);
        const snapshot = await getDocs(q);
        const fetchedTests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTests((prev) =>
          loadMore ? [...prev, ...fetchedTests] : fetchedTests
        );
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(fetchedTests.length === PAGE_SIZE);
      } catch (error) {
        toast.error("Failed to fetch tests.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [lastDoc, hasMore, isLoadingMore]
  );

  useEffect(() => {
    fetchTests();
  }, []);

  const handleTestCreated = () => {
    fetchTests(false);
  };

  // --- NEW: Functions to open the modals ---
  const openEditModal = (test) => {
    setSelectedTest(test);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (test) => {
    setSelectedTest(test);
    setIsDeleteModalOpen(true);
  };

  // --- NEW: Function to handle deleting a test ---
  const handleDeleteTest = async () => {
    if (!selectedTest) return;
    const loadingToast = toast.loading("Deleting test...");

    try {
      const batch = writeBatch(db);
      const testRef = doc(db, "mockTests", selectedTest.id);

      if (!selectedTest.isDynamic) {
        const questionsQuery = query(
          collection(db, "mockTestQuestions"),
          where("testId", "==", selectedTest.id)
        );
        const questionsSnapshot = await getDocs(questionsQuery);
        questionsSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }

      batch.delete(testRef);
      await batch.commit();
      toast.success("Test deleted successfully.", { id: loadingToast });
      fetchTests(false);
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedTest(null);
    }
  };

  return (
    <>
      {/* --- NEW: Render the modals (they are invisible until opened) --- */}
      <EditTestModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        test={selectedTest}
        onTestUpdated={() => fetchTests(false)}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteTest}
        title='Delete Test'
        message={`Are you sure you want to delete "${selectedTest?.title}"? This action will also delete all associated questions and cannot be undone.`}
        confirmText='Yes, Delete'
      />

      <div>
        <h1 className='text-3xl font-bold text-slate-900 mb-8'>
          Mock Test Management
        </h1>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-1'>
            <div className='bg-white p-6 rounded-2xl shadow-lg border'>
              <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
                <Plus /> Create New Test
              </h2>
              <MockTestManager onTestCreated={handleTestCreated} />
            </div>
          </div>
          <div className='lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border'>
            <h2 className='text-xl font-bold text-slate-900 mb-4'>
              Existing Tests
            </h2>
            {isLoading ? (
              <p className='text-center p-8 text-slate-600'>Loading tests...</p>
            ) : (
              <div className='space-y-3'>
                {/* --- PRESERVED: Your original rendering logic --- */}
                {tests.length > 0 ? (
                  tests.map((test) => (
                    <div
                      key={test.id}
                      className='flex justify-between items-center p-4 border rounded-lg hover:bg-slate-50 transition-colors'
                    >
                      <div>
                        <p className='font-semibold text-slate-800'>
                          {test.title}
                        </p>
                        {/* --- PRESERVED: Your original details display --- */}
                        {test.isDynamic ? (
                          <p className='text-sm text-slate-500'>
                            {test.questionCount || 0} Questions (Dynamic) |
                            Topic:{" "}
                            {toSentenceCase(test.sourceCriteria?.topic) ||
                              "N/A"}{" "}
                            | Subject:{" "}
                            {toSentenceCase(test.sourceCriteria?.subject) ||
                              "N/A"}
                          </p>
                        ) : (
                          <p className='text-sm text-slate-500'>
                            {test.questionCount || 0} Questions (Static)
                          </p>
                        )}
                      </div>
                      <div className='flex items-center gap-1'>
                        {/* --- PRESERVED: Your original "Manage Questions" button logic --- */}
                        {!test.isDynamic ? (
                          <Link
                            href={`/admin/mock-tests/${test.id}`}
                            className='px-4 py-2 text-sm bg-indigo-700 text-center text-white font-semibold rounded-lg hover:bg-indigo-800'
                          >
                            Manage Questions
                          </Link>
                        ) : (
                          <span className='px-4 py-2 text-sm bg-slate-100 text-slate-500 font-semibold rounded-lg cursor-not-allowed'>
                            Dynamic
                          </span>
                        )}
                        {/* --- NEW: Edit and Delete buttons added here --- */}
                        <button
                          onClick={() => openEditModal(test)}
                          className='p-2 text-slate-500 hover:bg-blue-100 hover:text-blue-600 rounded-lg'
                          title='Edit Test Details'
                        >
                          <Edit size={16} />
                        </button>
                        {/* <button
                          onClick={() => openDeleteModal(test)}
                          className='p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded-lg'
                          title='Delete Test'
                        >
                          <Trash2 size={16} />
                        </button> */}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-center p-8 text-slate-600'>
                    No tests created yet.
                  </p>
                )}

                {hasMore && (
                  <div className='text-center mt-6'>
                    <button
                      onClick={() => fetchTests(true)}
                      disabled={isLoadingMore}
                      className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50'
                    >
                      {isLoadingMore ? "Loading..." : "Load More"}
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
