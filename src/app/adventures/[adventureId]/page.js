// src/app/adventures/[adventureId]/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { MapPin, Lock, CheckCircle, Play, Trophy } from "lucide-react";
import Link from "next/link";

export default function AdventureDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { adventureId } = params;

  const [adventure, setAdventure] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAdventureData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const adventureRef = doc(db, "adventures", adventureId);
      const progressRef = doc(
        db,
        `users/${user.uid}/adventureProgress`,
        adventureId
      );

      const [advSnap, progSnap] = await Promise.all([
        getDoc(adventureRef),
        getDoc(progressRef),
      ]);

      if (!advSnap.exists()) {
        toast.error("This adventure does not exist.");
        router.push("/adventures");
        return;
      }
      setAdventure({ id: advSnap.id, ...advSnap.data() });

      if (progSnap.exists()) {
        setProgress(progSnap.data());
      } else {
        // If no progress, create a starting document
        const initialProgress = {
          adventureId: advSnap.id,
          userId: user.uid,
          stagesCompleted: 0,
          startedAt: serverTimestamp(),
          lastAttempt: null,
        };
        await setDoc(progressRef, initialProgress);
        setProgress(initialProgress);
      }
    } catch (error) {
      toast.error("Failed to load adventure data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [adventureId, user, router]);

  useEffect(() => {
    if (!authLoading) {
      fetchAdventureData();
    }
  }, [authLoading, fetchAdventureData]);

  const handleStartStage = (stageIndex) => {
    // This is where you would redirect to a special test-taking page for adventures
    // For now, it will just show a toast.
    toast.success(
      `Starting Stage ${stageIndex + 1}: ${adventure.stages[stageIndex].name}`
    );
    // Example redirect: router.push(`/adventures/play/${adventureId}/stage/${stageIndex}`);
  };

  if (loading || authLoading) {
    return <div className='text-center p-12'>Loading Your Adventure...</div>;
  }

  if (!adventure) {
    return null; // Redirects are handled in fetch logic
  }

  const stagesCompleted = progress?.stagesCompleted || 0;

  return (
    <div className='bg-slate-100 min-h-screen py-12'>
      <div className='container mx-auto px-4'>
        <div className='max-w-3xl mx-auto'>
          <div className='text-center mb-8'>
            <p className='font-semibold text-indigo-600'>
              {adventure.examName}
            </p>
            <h1 className='text-4xl font-extrabold text-slate-900 mt-1'>
              {adventure.title}
            </h1>
            <p className='mt-3 text-slate-600'>{adventure.description}</p>
          </div>

          <div className='space-y-4'>
            {adventure.stages.map((stage, index) => {
              const isUnlocked = index <= stagesCompleted;
              const isCompleted = index < stagesCompleted;
              let Icon = Lock;
              let iconColor = "text-slate-400";
              let buttonAction = null;
              let buttonText = "Locked";
              let buttonClasses =
                "bg-slate-200 text-slate-500 cursor-not-allowed";

              if (isCompleted) {
                Icon = CheckCircle;
                iconColor = "text-green-500";
                buttonText = "Completed";
                buttonClasses = "bg-green-100 text-green-700 cursor-default";
              } else if (isUnlocked) {
                Icon = stage.type === "boss" ? Trophy : Play;
                iconColor = "text-indigo-500";
                buttonAction = () => handleStartStage(index);
                buttonText =
                  stage.type === "boss" ? "Start Final Boss" : "Start Stage";
                buttonClasses = "bg-indigo-600 text-white hover:bg-indigo-700";
              }

              return (
                <div
                  key={index}
                  className='bg-white p-4 rounded-xl shadow-md border flex items-center justify-between'
                >
                  <div className='flex items-center gap-4'>
                    <Icon className={`h-8 w-8 flex-shrink-0 ${iconColor}`} />
                    <div>
                      <h3 className='font-bold text-lg text-slate-800'>
                        {stage.name}
                      </h3>
                      <p className='text-sm text-slate-500'>
                        {stage.questionCount} Questions | {stage.unlockScore}%
                        to pass
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={buttonAction}
                    disabled={!isUnlocked || isCompleted}
                    className={`px-4 py-2 font-semibold rounded-lg text-sm ${buttonClasses}`}
                  >
                    {buttonText}
                  </button>
                </div>
              );
            })}
          </div>
          <div className='mt-8 text-center'>
            <Link
              href='/adventures'
              className='font-semibold text-indigo-600 hover:underline'
            >
              &larr; Back to All Adventures
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
