// src/components/dashboard/DailyChallenges.js

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { Target } from "lucide-react";

export default function DailyChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      const challengeRef = doc(db, "challenges", "daily");
      const challengeSnap = await getDoc(challengeRef);
      if (challengeSnap.exists()) {
        setChallenges(challengeSnap.data().challenges || []);
      }
      setLoading(false);
    };

    fetchChallenges();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen for real-time progress updates
    const progressRef = doc(
      db,
      "users",
      user.uid,
      "challengeProgress",
      "daily"
    );
    const unsubscribe = onSnapshot(progressRef, (doc) => {
      setProgress(doc.exists() ? doc.data() : {});
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-pulse'>
        <div className='h-8 bg-slate-200 rounded w-1/2 mb-4'></div>
        <div className='space-y-4'>
          <div className='h-10 bg-slate-200 rounded'></div>
          <div className='h-10 bg-slate-200 rounded'></div>
          <div className='h-10 bg-slate-200 rounded'></div>
        </div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return null; // Don't show the component if no challenges are set
  }

  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
      <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3 mb-4'>
        <Target className='text-red-500' />
        Today's Challenges
      </h2>
      <div className='space-y-4'>
        {challenges.map((challenge) => {
          const currentProgress = progress[challenge.id] || 0;
          const isCompleted = currentProgress >= challenge.target;
          const progressPercent = Math.min(
            (currentProgress / challenge.target) * 100,
            100
          );

          return (
            <div key={challenge.id}>
              <div className='flex justify-between items-center mb-1'>
                <p
                  className={`text-sm font-medium ${
                    isCompleted ? "text-green-600" : "text-slate-700"
                  }`}
                >
                  {challenge.text}
                </p>
                <p
                  className={`text-sm font-bold ${
                    isCompleted ? "text-green-600" : "text-slate-600"
                  }`}
                >
                  {currentProgress} / {challenge.target}
                </p>
              </div>
              <div className='w-full bg-slate-200 rounded-full h-2.5'>
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    isCompleted ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
