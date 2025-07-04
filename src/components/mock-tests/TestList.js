"use client";

import { useState, useMemo, useEffect } from "react";
import TestCard from "./TestCard";
import { useAuth } from "@/context/AuthContext"; // Import the useAuth hook

const PAGE_SIZE = 9;

export default function TestList({ initialTests }) {
  const { user } = useAuth(); // Get the current user
  const [tests, setTests] = useState(initialTests);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasMore, setHasMore] = useState(initialTests.length === PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [takenTestIds, setTakenTestIds] = useState(new Set()); // State to store taken test IDs

  // THIS IS THE NEW LOGIC:
  // When the component mounts and we have a user, fetch their taken tests.
  useEffect(() => {
    if (user) {
      const fetchTakenTests = async () => {
        try {
          const res = await fetch(`/api/users/${user.uid}/taken-tests`);
          const ids = await res.json();
          if (Array.isArray(ids)) {
            setTakenTestIds(new Set(ids));
          }
        } catch (error) {
          console.error("Could not fetch taken tests", error);
        }
      };
      fetchTakenTests();
    }
  }, [user]);

  const filteredTests = useMemo(() => {
    if (!searchTerm) return tests;
    return tests.filter(
      (test) =>
        test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.examName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, tests]);

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

      {tests.length > 0 ? (
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
            <p className='mt-2 text-gray-600'>
              Try adjusting your search term.
            </p>
          </div>
        )
      ) : (
        <div className='text-center py-16 px-6 bg-white rounded-2xl shadow-lg border border-slate-100'>
          <h3 className='text-2xl font-bold text-gray-800'>
            No Tests Available
          </h3>
          <p className='mt-2 text-gray-600'>
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
