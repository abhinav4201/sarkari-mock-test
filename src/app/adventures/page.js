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
import { Map, CheckCircle, Star, User } from "lucide-react";
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
    <div className='bg-slate-50 min-h-screen py-16'>
      <div className='container mx-auto px-4'>
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
                  <div className='bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-full flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all'>
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
                    <div className='p-6 bg-slate-50 border-t'>
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
                            : "text-indigo-700 bg-indigo-100 group-hover:bg-indigo-200"
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
          <div className='text-center p-12 bg-white rounded-lg shadow'>
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
