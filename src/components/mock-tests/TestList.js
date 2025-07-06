"use client";

import { useState, useMemo, useEffect } from "react";
import TestCard from "./TestCard";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";

const PAGE_SIZE = 9;

export default function TestList({ initialTests }) {
  const { user } = useAuth();
  const [tests, setTests] = useState(initialTests);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasMore, setHasMore] = useState(initialTests.length === PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [takenTestIds, setTakenTestIds] = useState(new Set());

  useEffect(() => {
    if (user) {
      const fetchTakenTests = async () => {
        try {
          const resultsQuery = query(
            collection(db, "mockTestResults"),
            where("userId", "==", user.uid)
          );
          const resultsSnapshot = await getDocs(resultsQuery);
          const ids = new Set(
            resultsSnapshot.docs.map((doc) => doc.data().testId)
          );
          setTakenTestIds(ids);
        } catch (error) {
          console.error("Could not fetch user's test history", error);
        }
      };
      fetchTakenTests();
    } else {
      setTakenTestIds(new Set());
    }
  }, [user]);

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      // Condition 1: Does the test match the search term?
      const matchesSearch = searchTerm
        ? test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          test.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
          test.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          test.examName.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      if (!matchesSearch) {
        return false;
      }

      // --- NEW ACCESS CONTROL LOGIC STARTS HERE ---
      // This logic replaces the old JSON file check.
      const allowedUsers = test.allowedUserIds;

      // If the 'allowedUserIds' field doesn't exist or is empty, the test is public.
      if (!allowedUsers || allowedUsers.length === 0) {
        return true;
      }

      // If the field exists, the user must be logged in to see the test.
      if (!user) {
        return false;
      }

      // Check if the logged-in user's ID is in the allowed list.
      return allowedUsers.includes(user.uid);
      // --- NEW ACCESS CONTROL LOGIC ENDS HERE ---
    });
  }, [searchTerm, tests, user]);

  const loadMoreTests = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);

    try {
      const lastTest = tests[tests.length - 1];
      const cursor = lastTest ? lastTest.createdAt : "";

      const res = await fetch(`/api/mock-tests?cursor=${cursor}`);
      const newTests = await res.json();

      if (Array.isArray(newTests)) {
        setTests((prev) => [...prev, ...newTests]);
        if (newTests.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      toast.error("Failed to load more tests.");
      console.error("Failed to load more tests", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div>
      <div className='mb-12 max-w-2xl mx-auto'>
        <input
          type='text'
          placeholder='Search Tests by Title, Topic, or Exam...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full p-4 bg-white border-2 border-slate-200 rounded-full shadow-inner focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-center text-lg text-gray-900 placeholder:text-gray-500'
        />
      </div>

      {initialTests.length > 0 ? (
        filteredTests.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {filteredTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                hasTaken={takenTestIds.has(test.id)}
              />
            ))}
          </div>
        ) : (
          <div className='text-center py-16 px-6 bg-white rounded-2xl shadow-lg border border-slate-100'>
            <h3 className='text-2xl font-bold text-gray-800'>
              No Matching Tests Found
            </h3>
            <p className='mt-2 text-gray-700'>
              Try adjusting your search term or check if tests are available for
              your account.
            </p>
          </div>
        )
      ) : (
        <div className='text-center py-16 px-6 bg-white rounded-2xl shadow-lg border border-slate-100'>
          <h3 className='text-2xl font-bold text-gray-800'>
            No Tests Available
          </h3>
          <p className='mt-2 text-gray-700'>
            Our team is working on adding new tests. Please check back soon!
          </p>
        </div>
      )}

      {hasMore && (
        <div className='text-center mt-16'>
          <button
            onClick={loadMoreTests}
            disabled={loadingMore}
            className='px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-all'
          >
            {loadingMore ? "Loading..." : "Load More Tests"}
          </button>
        </div>
      )}
    </div>
  );
}
