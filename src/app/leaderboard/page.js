// src/app/leaderboard/page.js
"use client";

import {
  Award,
  PartyPopper,
  Trophy,
  Star,
  TrendingUp,
  Crown,
} from "lucide-react";
import { useEffect, useState } from "react";

// New background component with a winner/success theme
const LeaderboardBackground = () => (
  <div className='absolute inset-0 z-0 overflow-hidden'>
    {/* Large, faint background elements */}
    <Trophy className='absolute -top-16 -right-16 h-80 w-80 text-yellow-400/10 transform rotate-12' />
    <Star className='absolute top-1/2 left-0 h-64 w-64 text-pink-400/10 transform -translate-x-1/2 -rotate-12' />
    <TrendingUp className='absolute bottom-0 -left-12 h-72 w-72 text-green-400/10 transform rotate-45' />

    {/* Smaller, more distinct icons */}
    <Crown className='absolute top-20 left-1/4 h-24 w-24 text-yellow-500/20 transform -rotate-6' />
    <Award className='absolute bottom-1/4 right-1/4 h-20 w-20 text-blue-500/20 transform rotate-6' />
    <Star className='absolute bottom-10 left-10 h-16 w-16 text-red-500/20' />
  </div>
);

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
    <div className='relative min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-100 py-12 overflow-hidden'>
      <LeaderboardBackground />
      <div className='relative z-10 container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-extrabold text-slate-900'>
            Weekly Leaderboard
          </h1>
          <p className='mt-4 text-lg text-slate-700 max-w-2xl mx-auto'>
            See who's at the top this week. Keep practicing to climb the ranks!
          </p>
        </div>

        {loading ? (
          <div className='text-center text-slate-600'>
            Loading leaderboard...
          </div>
        ) : leaderboard.length > 0 ? (
          <div className='max-w-2xl mx-auto bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-slate-200/50'>
            {leaderboard.map((entry, index) => {
              const isAmbassador = entry.isAmbassador === true;
              let rankStyle = "";
              if (index === 0)
                rankStyle =
                  "bg-yellow-100/80 border-l-4 border-yellow-400 font-bold";
              else if (index === 1)
                rankStyle =
                  "bg-slate-100/80 border-l-4 border-slate-400 font-medium";
              else if (index === 2)
                rankStyle =
                  "bg-orange-100/50 border-l-4 border-orange-400 font-medium";

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-lg ${rankStyle} mb-3 transition-all`}
                >
                  <div className='flex items-center'>
                    <span className='text-lg font-bold text-slate-500 w-8'>
                      {index + 1}
                    </span>
                    <span
                      className={`font-semibold ${
                        isAmbassador ? "text-amber-700" : "text-slate-800"
                      }`}
                    >
                      {isAmbassador && (
                        <Award className='inline-block h-4 w-4 mr-1.5 text-amber-500' />
                      )}
                      {entry.userName}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Trophy className='h-5 w-5 text-yellow-500' />
                    <span className='font-bold text-lg text-slate-900'>
                      {entry.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='max-w-2xl mx-auto bg-white/70 backdrop-blur-md p-12 rounded-2xl shadow-lg text-center'>
            <PartyPopper className='h-16 w-16 mx-auto text-indigo-500' />
            <h3 className='mt-4 text-2xl font-bold text-slate-800'>
              Get Ready for the Next Challenge!
            </h3>
            <p className='mt-2 text-slate-600 text-lg'>
              A new leaderboard is calculated every{" "}
              <span className='font-bold text-green-600'>Sunday</span> at{" "}
              <span className='font-bold text-purple-600'>12:00 AM</span>. Come
              back next week to see the new rankings!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
