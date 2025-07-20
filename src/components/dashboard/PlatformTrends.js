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
        setTrends(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className='text-center p-8'>Loading trends...</div>;
  }

  return (
    <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-8'>
      <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
        <h3 className='text-2xl font-bold text-slate-900 flex items-center gap-2'>
          <Flame className='text-red-500' />
          Trending Topics
        </h3>
        <ul className='mt-4 space-y-2'>
          {trends.trendingTopics.map(([topic, count]) => (
            <li
              key={topic}
              className='flex justify-between items-center text-slate-700'
            >
              <span>{topic}</span>
              <span className='font-bold'>{count} attempts</span>
            </li>
          ))}
        </ul>
      </div>
      <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
        <h3 className='text-2xl font-bold text-slate-900 flex items-center gap-2'>
          <Star className='text-yellow-500' />
          Most Popular Exams
        </h3>
        <ul className='mt-4 space-y-2'>
          {trends.popularExams.map(([exam, count]) => (
            <li
              key={exam}
              className='flex justify-between items-center text-slate-700'
            >
              <span>{exam}</span>
              <span className='font-bold'>{count} attempts</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
