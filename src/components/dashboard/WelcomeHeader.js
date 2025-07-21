// src/components/dashboard/WelcomeHeader.js

"use client";
import { useAuth } from "@/context/AuthContext";
import { Flame } from "lucide-react";

// Helper to get rank from level
const getRank = (level) => {
  if (level >= 31) return "Master";
  if (level >= 16) return "Prodigy";
  if (level >= 6) return "Scholar";
  return "Aspirant";
};

export default function WelcomeHeader() {
  const { user, userProfile } = useAuth();

  const rank = userProfile?.level ? getRank(userProfile.level) : "Aspirant";
  const currentXp = userProfile?.xp || 0;
  const currentLevel = userProfile?.level || 1;
  const xpForNextLevel = currentLevel * 100;
  const xpProgressPercent = (currentXp / xpForNextLevel) * 100;
  const currentStreak = userProfile?.currentStreak || 0;


  return (
    <div>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center'>
        <div>
          <h1 className='text-3xl sm:text-4xl font-bold text-slate-900'>
            Welcome back, {rank}{" "}
            {user ? user.displayName.split(" ")[0] : "User"}!
          </h1>
          <p className='mt-2 text-lg text-slate-700'>
            Let's continue your journey to success.
          </p>
        </div>
        {currentStreak > 0 && (
          <div className='mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-full font-bold'>
            <Flame className='h-5 w-5' />
            <span>{currentStreak} Day Streak!</span>
          </div>
        )}
      </div>

      {/* XP Bar */}
      <div className='mt-4 max-w-md'>
        <div className='flex justify-between items-center mb-1'>
          <span className='text-sm font-bold text-indigo-600'>
            Level {currentLevel}
          </span>
          <span className='text-sm font-medium text-slate-600'>
            {currentXp} / {xpForNextLevel} XP
          </span>
        </div>
        <div className='w-full bg-slate-200 rounded-full h-2.5'>
          <div
            className='bg-indigo-600 h-2.5 rounded-full'
            style={{ width: `${xpProgressPercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
