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
      <div className='mb-12 max-w-2xl mx-auto'>
        {/* Input field styled for high contrast and visibility */}
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
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        ) : (
          <div className='text-center py-16 px-6 bg-white rounded-2xl shadow-lg border border-slate-100'>
            <h3 className='text-2xl font-bold text-gray-800'>
              No Matching Tests Found
            </h3>
            <p className='mt-2 text-gray-600'>
              Try adjusting your search term or check back later for new tests.
            </p>
          </div>
        )
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='h-72 bg-slate-200 rounded-2xl'></div>
          ))}
        </div>
      )}
    </div>
  );

}
