"use client";
import { useState, useMemo } from "react";
import TestCard from "./TestCard";

export default function TestList({ tests }) {
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <div>
      <div className='mb-8'>
        <input
          type='text'
          placeholder='Search by title, topic, subject, or exam name...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500'
        />
      </div>

      {filteredTests.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {filteredTests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      ) : (
        <p className='text-center text-gray-600'>
          No tests found matching your criteria.
        </p>
      )}
    </div>
  );
}
