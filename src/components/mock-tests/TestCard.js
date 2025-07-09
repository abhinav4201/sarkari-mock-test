"use client";

import Link from "next/link";
import {
  FileText,
  Clock,
  Tag,
  CheckCircle2,
  Shuffle,
  Star,
} from "lucide-react";

// The TestCard is now a simple display component.
// All logic for starting a test has been removed.
export default function TestCard({ test, hasTaken }) {
  // The button text still changes based on whether the test has been taken.
  const buttonText = hasTaken
    ? "View Details & Retake"
    : "View Details & Start";
  const buttonColorClass = hasTaken
    ? "bg-green-600 hover:bg-green-700"
    : "bg-indigo-600 hover:bg-indigo-700";

  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-100 flex flex-col'>
      <div>
        <div className='flex flex-wrap items-center gap-2 mb-3'>
          {test.isDynamic && (
            <div className='flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full'>
              <Shuffle className='h-3.5 w-3.5' />
              <span>Randomized</span>
            </div>
          )}
          {hasTaken && (
            <div className='flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full'>
              <CheckCircle2 className='h-3.5 w-3.5' />
              <span>Completed</span>
            </div>
          )}
          {test.isPremium && (
            <div className='flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full'>
              <Star className='h-3.5 w-3.5' />
              <span>Premium</span>
            </div>
          )}
        </div>
        <h2 className='text-xl font-bold text-gray-900'>{test.title}</h2>
        <p className='text-sm text-gray-600 mt-1'>{test.examName}</p>
      </div>
      <div className='my-6 space-y-3 text-gray-700 border-t border-b border-slate-100 py-4'>
        <div className='flex items-center'>
          <FileText className='h-5 w-5 mr-3 text-indigo-500' />{" "}
          {test.questionCount || 0} Questions
        </div>
        <div className='flex items-center'>
          <Clock className='h-5 w-5 mr-3 text-indigo-500' />{" "}
          {test.estimatedTime} Minutes
        </div>
        <div className='flex items-center'>
          <Tag className='h-5 w-5 mr-3 text-indigo-500' /> {test.topic}
        </div>
      </div>
      <div className='mt-auto'>
        {/* The entire card now links to the details page. */}
        <Link
          href={`/mock-tests/${test.id}`}
          className={`block w-full text-center px-4 py-3 text-white rounded-lg font-semibold transition-all duration-200 shadow-md ${buttonColorClass}`}
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}
