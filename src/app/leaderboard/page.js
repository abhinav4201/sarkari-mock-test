// src/app/leaderboard/page.js
"use client";

import { Award, PartyPopper } from "lucide-react"; // Changed ShieldX to PartyPopper
import { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className='bg-slate-100 min-h-screen py-12'>
      <div className='container mx-auto px-4'>
        <h1 className='text-4xl font-extrabold text-center text-slate-900 mb-8'>
          Weekly Leaderboard
        </h1>
        {loading ? (
          <div className='text-center text-slate-600'>
            Loading leaderboard...
          </div>
        ) : leaderboard.length > 0 ? (
          <div className='max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-lg'>
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className='flex items-center justify-between p-4 border-b last:border-b-0'
              >
                <div className='flex items-center'>
                  <span className='text-lg font-bold w-10 text-slate-500'>
                    {index + 1}
                  </span>
                  <span className='font-semibold text-slate-800'>
                    {entry.userName}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Award className='h-5 w-5 text-yellow-500' />
                  <span className='font-bold text-lg text-slate-900'>
                    {entry.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // THIS SECTION HAS BEEN UPDATED FOR A BETTER VIBE
          <div className='max-w-2xl mx-auto bg-white p-12 rounded-2xl shadow-lg text-center'>
            <PartyPopper className='h-16 w-16 mx-auto text-indigo-500' />
            <h3 className='mt-4 text-2xl font-bold text-slate-800'>
              Get Ready for the Next Challenge!
            </h3>
            <p className='mt-2 text-slate-600 text-lg'>
              A new leaderboard is calculated every{" "}
              <span className='font-bold text-green-600'>Sunday</span> at{" "}
              <span className='font-bold text-purple-600'>12:00 AM</span>. Come
              back then to see the new champions!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
