// src/components/dashboard/PlatformTrends.js
"use client";

import { Flame, Star } from "lucide-react";
import { useEffect, useState } from "react";

export default function PlatformTrends() {
  const [trends, setTrends] = useState({
    trendingTopics: [],
    popularExams: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trends")
      .then((res) => res.json())
      .then((data) => {
        // Ensure data exists before setting state
        if (data && data.trendingTopics && data.popularExams) {
          setTrends(data);
        }
      })
      .catch((err) => console.error("Failed to fetch trends", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse'>
        <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
          <div className='h-8 bg-slate-200 rounded w-3/4 mb-4'></div>
          <div className='space-y-3'>
            <div className='h-4 bg-slate-200 rounded'></div>
            <div className='h-4 bg-slate-200 rounded w-5/6'></div>
            <div className='h-4 bg-slate-200 rounded w-4/6'></div>
          </div>
        </div>
        <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
          <div className='h-8 bg-slate-200 rounded w-3/4 mb-4'></div>
          <div className='space-y-3'>
            <div className='h-4 bg-slate-200 rounded'></div>
            <div className='h-4 bg-slate-200 rounded w-5/6'></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if there are no trends to show
  if (trends.trendingTopics.length === 0 && trends.popularExams.length === 0) {
    return null;
  }

  return (
    <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-8'>
      {/* Trending Topics Card */}
      {trends.trendingTopics.length > 0 && (
        <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
          <h3 className='text-2xl font-bold text-slate-900 flex items-center gap-2'>
            <Flame className='text-red-500' />
            Trending Topics
          </h3>
          <ul className='mt-4 space-y-2'>
            {/* --- THIS IS THE FIX --- */}
            {trends.trendingTopics.map((item) => (
              <li
                key={item.name}
                className='flex justify-between items-center text-slate-700'
              >
                <span>{item.name}</span>
                <span className='font-bold'>{item.count} attempts</span>
              </li>
            ))}
            {/* --- END OF FIX --- */}
          </ul>
        </div>
      )}
      {/* Popular Exams Card */}
      {trends.popularExams.length > 0 && (
        <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
          <h3 className='text-2xl font-bold text-slate-900 flex items-center gap-2'>
            <Star className='text-yellow-500' />
            Most Popular Exams
          </h3>
          <ul className='mt-4 space-y-2'>
            {/* --- THIS IS THE FIX --- */}
            {trends.popularExams.map((item) => (
              <li
                key={item.name}
                className='flex justify-between items-center text-slate-700'
              >
                <span>{item.name}</span>
                <span className='font-bold'>{item.count} attempts</span>
              </li>
            ))}
            {/* --- END OF FIX --- */}
          </ul>
        </div>
      )}
    </div>
  );
}
