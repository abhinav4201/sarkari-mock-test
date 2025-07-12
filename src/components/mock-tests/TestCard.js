"use client";

import {
  CheckCircle2,
  Clock,
  FileText,
  Shuffle,
  Star,
  Tag,
} from "lucide-react";
import Link from "next/link";
import LikeButton from "./LikeButton";
// import { useMemo } from "react";

export default function TestCard({ test, hasTaken }) {
  const buttonText = hasTaken
    ? "View Details & Retake"
    : "View Details & Start";
  const buttonColorClass = hasTaken
    ? "bg-green-600 hover:bg-green-700"
    : "bg-indigo-600 hover:bg-indigo-700";

  // const displayLikeCount = useMemo(() => {
  //   return test.likeCount || Math.floor(10000 + Math.random() * 5000);
  // }, [test.likeCount]);

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
      <div className='mt-auto flex justify-between items-center'>
        <LikeButton testId={test.id} initialLikeCount={test.likeCount} />
        <Link
          href={`/mock-tests/${test.id}`}
          className={`px-5 py-2 text-sm text-white rounded-lg font-semibold transition-all duration-200 shadow-md ${buttonColorClass}`}
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}
