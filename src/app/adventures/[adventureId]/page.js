// src/app/adventures/[adventureId]/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { Lock, CheckCircle, Play, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";

// New Bouncing Ball Animation Component
const BouncingBall = ({ size, initialTop, initialLeft, duration }) => (
  <div
    className='absolute rounded-full bg-gradient-to-br from-pink-400 to-purple-500 opacity-30'
    style={{
      width: size,
      height: size,
      top: `${initialTop}%`,
      left: `${initialLeft}%`,
      animation: `bounce ${duration}s infinite alternate ease-in-out`,
    }}
  />
);

// New Stage Background Component
const StageBackground = () => (
  <div className='absolute inset-0 z-0 overflow-hidden'>
    {/* Stage "ropes" from the top */}
    <svg
      className='absolute top-0 left-0 w-full h-48 text-indigo-500/10'
      preserveAspectRatio='none'
    >
      <line
        x1='10%'
        y1='0'
        x2='20%'
        y2='100%'
        stroke='currentColor'
        strokeWidth='2'
      />
      <line
        x1='30%'
        y1='0'
        x2='35%'
        y2='100%'
        stroke='currentColor'
        strokeWidth='1'
      />
      <line
        x1='50%'
        y1='0'
        x2='50%'
        y2='100%'
        stroke='currentColor'
        strokeWidth='3'
      />
      <line
        x1='70%'
        y1='0'
        x2='65%'
        y2='100%'
        stroke='currentColor'
        strokeWidth='1'
      />
      <line
        x1='90%'
        y1='0'
        x2='80%'
        y2='100%'
        stroke='currentColor'
        strokeWidth='2'
      />
    </svg>

    {/* Animated Bouncing Balls */}
    <BouncingBall size={60} initialTop={10} initialLeft={5} duration={10} />
    <BouncingBall size={80} initialTop={50} initialLeft={20} duration={12} />
    <BouncingBall size={40} initialTop={80} initialLeft={-5} duration={8} />
    <BouncingBall size={100} initialTop={30} initialLeft={85} duration={15} />
    <BouncingBall size={50} initialTop={60} initialLeft={95} duration={9} />
  </div>
);

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
    toast.success(
      `Starting Stage ${stageIndex + 1}: ${adventure.stages[stageIndex].name}`
    );
    // Example redirect: router.push(`/adventures/play/${adventureId}/stage/${stageIndex}`);
  };

  if (loading || authLoading) {
    return <div className='text-center p-12'>Loading Your Adventure...</div>;
  }

  if (!adventure) {
    return null;
  }

  const stagesCompleted = progress?.stagesCompleted || 0;

  return (
    <div className='relative min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 py-12 overflow-hidden'>
      <style jsx global>{`
        @keyframes bounce {
          from {
            transform: translateX(0) scale(1);
          }
          to {
            transform: translateX(calc(100vw - 100%)) scale(1.1);
          }
        }
      `}</style>
      <StageBackground />
      <div className='relative z-10 container mx-auto px-4'>
        <div className='max-w-3xl mx-auto'>
          <div className='text-center mb-8 bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg'>
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
                buttonClasses =
                  "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl";
              }

              return (
                <div
                  key={index}
                  className='bg-white/70 backdrop-blur-md p-4 rounded-xl shadow-md border flex items-center justify-between transition-all hover:shadow-lg hover:scale-105'
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
                    className={`px-4 py-2 font-semibold rounded-lg text-sm transition-all ${buttonClasses}`}
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
              className='inline-flex items-center gap-2 font-semibold text-indigo-600 hover:underline'
            >
              <ArrowLeft size={16} /> Back to All Adventures
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
