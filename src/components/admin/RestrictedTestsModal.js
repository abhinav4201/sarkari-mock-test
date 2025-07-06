"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
} from "firebase/firestore";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";

const PAGE_SIZE = 10;

export default function RestrictedTestsModal({ isOpen, onClose }) {
  const [tests, setTests] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchRestrictedTests = useCallback(
    async (initialLoad = false) => {
      if (!hasMore && !initialLoad) return;
      initialLoad ? setLoading(true) : setLoadingMore(true);

      try {
        const testsRef = collection(db, "mockTests");
        const queryConstraints = [
          where("isRestricted", "==", true),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE),
        ];

        if (!initialLoad && lastDoc) {
          queryConstraints.push(startAfter(lastDoc));
        }

        const q = query(testsRef, ...queryConstraints);
        const snapshot = await getDocs(q);
        const newTests = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          allowedCount: doc.data().allowedUserIds?.length || 0,
        }));

        setTests((prev) => (initialLoad ? newTests : [...prev, ...newTests]));
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(newTests.length === PAGE_SIZE);
      } catch (error) {
        toast.error(
          "Failed to load restricted tests. You may need to create a Firestore index."
        );
        console.error("Error fetching restricted tests:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [lastDoc, hasMore]
  );

  useEffect(() => {
    if (isOpen) {
      fetchRestrictedTests(true);
    } else {
      setTests([]);
      setLastDoc(null);
      setHasMore(true);
      setLoading(true);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Restricted Tests Summary'>
      <div className='space-y-4'>
        {loading ? (
          <p className='text-center p-8'>Loading summary...</p>
        ) : tests.length > 0 ? (
          <div className='overflow-x-auto'>
            <table className='w-full text-left table-auto'>
              <thead className='bg-slate-100 border-b border-slate-200'>
                <tr>
                  <th className='p-4 text-sm font-semibold text-slate-800'>
                    Test Title
                  </th>
                  <th className='p-4 text-sm font-semibold text-slate-800 text-center'>
                    Allowed Users
                  </th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr
                    key={test.id}
                    className='border-b border-slate-100 hover:bg-slate-50'
                  >
                    <td className='p-4 font-semibold text-slate-900'>
                      {test.title}
                    </td>
                    <td className='p-4 text-slate-700 text-center font-bold text-lg'>
                      {test.allowedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className='text-center p-8 text-slate-600'>
            No tests have restricted access.
          </p>
        )}

        {hasMore && !loading && (
          <div className='text-center pt-4 mt-4 border-t'>
            <button
              onClick={() => fetchRestrictedTests(false)}
              disabled={loadingMore}
              className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300'
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
