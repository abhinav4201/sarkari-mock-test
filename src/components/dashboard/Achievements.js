// src/components/dashboard/Achievements.js

"use client";

import { useAuth } from "@/context/AuthContext";
import { Award, ShieldCheck, Flame, Zap } from "lucide-react"; // Example icons

const badgeLibrary = {
  hot_streak: {
    icon: <Flame />,
    name: "Hot Streak",
    description: "Logged in 3 days in a row.",
  },
  iron_will: {
    icon: <Award />,
    name: "Iron Will",
    description: "Maintained a 7-day test streak.",
  },
  silver_resolve: {
    icon: <Award className='text-slate-400' />,
    name: "Silver Resolve",
    description: "Maintained a 15-day test streak.",
  },
  master_learner: {
    icon: <Award className='text-amber-400' />,
    name: "Master Learner",
    description: "Completed the 30-day Mastery Quest!",
  },
  perfectionist: {
    icon: <ShieldCheck />,
    name: "Perfectionist",
    description: "Scored 100% on a test.",
  },
  speed_demon: {
    icon: <Zap />,
    name: "Speed Demon",
    description: "Finished a test in under 50% of the time.",
  },
  // ... add other badges here
};

export default function Achievements() {
  const { userProfile } = useAuth();
  const earnedBadges = userProfile?.earnedBadges || [];

  if (earnedBadges.length === 0) {
    return (
      <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 text-center'>
        <h2 className='text-2xl font-bold text-slate-900 mb-2'>
          Your Trophy Case
        </h2>
        <p className='text-slate-600'>
          Start taking tests to earn achievements and unlock badges!
        </p>
      </div>
    );
  }

  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
      <h2 className='text-2xl font-bold text-slate-900 mb-4'>
        Your Trophy Case
      </h2>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
        {earnedBadges.map((badgeId) => {
          const badge = badgeLibrary[badgeId];
          if (!badge) return null;
          return (
            <div
              key={badgeId}
              className='flex flex-col items-center text-center p-4 bg-slate-50 rounded-lg'
              title={badge.description}
            >
              <div className='text-indigo-600 text-4xl mb-2'>{badge.icon}</div>
              <p className='font-semibold text-sm text-slate-800'>
                {badge.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
