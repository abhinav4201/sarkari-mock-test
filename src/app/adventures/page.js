// src/app/adventures/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";
import {
  Map,
  CheckCircle,
  Star,
  User,
  BookOpen,
  Atom,
  Sword,
  Calculator,
  Landmark,
} from "lucide-react";
import toast from "react-hot-toast";
import React from "react";

// New Badge Component to display creator status
const AdventureBadge = ({ status }) => {
  let badge = {
    text: "Community",
    icon: <User className='h-3.5 w-3.5' />,
    style: "bg-slate-100 text-slate-700",
  };

  if (status === "admin") {
    badge = {
      text: "Original",
      icon: <Star className='h-3.5 w-3.5' />,
      style: "bg-blue-100 text-blue-700",
    };
  } else if (status === "approved") {
    badge = {
      text: "Certified",
      icon: <CheckCircle className='h-3.5 w-3.5' />,
      style: "bg-green-100 text-green-700",
    };
  }

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full ${badge.style}`}
    >
      {badge.icon}
      <span>{badge.text}</span>
    </div>
  );
};

// New, more elaborate decorative component for the background
const AdventureBackground = () => (
  <div className='absolute inset-0 z-0 overflow-hidden'>
    {/* Large, faint background elements */}
    <Map className='absolute -top-24 -left-24 h-96 w-96 text-gray-400/5' />
    <BookOpen className='absolute -bottom-24 -right-24 h-96 w-96 text-gray-400/5' />

    {/* Floating icons */}
    <Sword className='absolute top-1/4 left-10 h-16 w-16 text-red-500/20 transform -rotate-12' />
    <Atom className='absolute top-1/2 right-12 h-20 w-20 text-blue-500/20 transform rotate-12' />
    <Calculator className='absolute bottom-1/4 left-1/3 h-12 w-12 text-green-500/20' />
    <Landmark className='absolute top-20 right-1/4 h-16 w-16 text-yellow-500/20 transform rotate-6' />

    {/* UPSC Text Icon */}
    <span
      className='absolute bottom-10 right-10 font-bold text-4xl text-purple-500/20'
      style={{ fontFamily: "serif" }}
    >
      UPSC
    </span>
    {/* SSC Text Icon */}
    <span
      className='absolute top-10 left-1/3 font-bold text-3xl text-cyan-500/20'
      style={{ fontFamily: "sans-serif" }}
    >
      SSC
    </span>
  </div>
);

export default function AdventuresPage() {
  const { user, loading: authLoading } = useAuth();
  const [adventures, setAdventures] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("Please log in to view Exam Adventures.");
      setLoading(false);
      return;
    }

    const fetchAdventuresAndProgress = async () => {
      try {
        const adventuresQuery = query(
          collection(db, "adventures"),
          orderBy("createdAt", "desc")
        );
        const adventuresSnapshot = await getDocs(adventuresQuery);
        const fetchedAdventures = adventuresSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAdventures(fetchedAdventures);

        const progressPromises = fetchedAdventures.map((adv) =>
          getDoc(doc(db, `users/${user.uid}/adventureProgress`, adv.id))
        );
        const progressSnapshots = await Promise.all(progressPromises);
        const userProgress = {};
        progressSnapshots.forEach((snap) => {
          if (snap.exists()) {
            userProgress[snap.id] = snap.data();
          }
        });
        setProgress(userProgress);
      } catch (error) {
        toast.error("Could not load adventures.");
        console.error("Error fetching adventures:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdventuresAndProgress();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return <div className='text-center p-12'>Loading Adventures...</div>;
  }

  if (!user) {
    return (
      <div className='text-center p-12'>
        <h2 className='text-2xl font-bold'>Login Required</h2>
        <p className='mt-2 text-slate-600'>
          Please log in to begin an Exam Adventure.
        </p>
      </div>
    );
  }

  return (
    <div className='relative bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 min-h-screen py-16'>
      <AdventureBackground />
      <div className='relative z-10 container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl md:text-5xl font-extrabold text-slate-900'>
            Exam Adventures
          </h1>
          <p className='mt-4 text-lg text-slate-600 max-w-2xl mx-auto'>
            Embark on a guided journey to master your exam. Complete stages,
            unlock challenges, and conquer the final boss!
          </p>
        </div>

        {adventures.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {adventures.map((adv) => {
              const userProgress = progress[adv.id];
              const stagesCompleted = userProgress?.stagesCompleted || 0;
              const totalStages = adv.stages?.length || 0;
              const progressPercent =
                totalStages > 0 ? (stagesCompleted / totalStages) * 100 : 0;
              const isCompleted =
                stagesCompleted === totalStages && totalStages > 0;

              return (
                <Link
                  key={adv.id}
                  href={`/adventures/${adv.id}`}
                  className='block group'
                >
                  <div className='bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-full flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all'>
                    <div className='p-6 flex-grow'>
                      <div className='flex justify-between items-start'>
                        <p className='font-semibold text-indigo-600'>
                          {adv.examName}
                        </p>
                        {/* --- Display the appropriate badge --- */}
                        <AdventureBadge status={adv.creatorStatus} />
                      </div>
                      <h3 className='text-2xl font-bold text-slate-800 mt-1'>
                        {adv.title}
                      </h3>
                      <p className='text-slate-600 mt-2 text-sm'>
                        {adv.description}
                      </p>
                    </div>
                    <div className='p-6 bg-slate-50/80 border-t'>
                      <div className='flex justify-between items-center mb-1 text-sm font-medium'>
                        <span className='text-slate-600'>Progress</span>
                        <span
                          className={
                            isCompleted ? "text-green-600" : "text-slate-800"
                          }
                        >
                          {stagesCompleted} / {totalStages} Stages
                        </span>
                      </div>
                      <div className='w-full bg-slate-200 rounded-full h-2.5'>
                        <div
                          className={`h-2.5 rounded-full ${
                            isCompleted ? "bg-green-500" : "bg-indigo-600"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <div
                        className={`mt-4 text-center font-bold py-2 rounded-lg ${
                          isCompleted
                            ? "text-green-700 bg-green-100"
                            : "text-white bg-blue-600 group-hover:bg-green-600"
                        }`}
                      >
                        {isCompleted
                          ? "Completed!"
                          : userProgress
                          ? "Continue Adventure"
                          : "Start Adventure"}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className='text-center p-12 bg-white/70 backdrop-blur-md rounded-lg shadow'>
            <h3 className='text-xl font-semibold'>
              No Adventures Available Yet
            </h3>
            <p className='text-slate-600 mt-2'>
              Check back soon for new guided learning paths!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
