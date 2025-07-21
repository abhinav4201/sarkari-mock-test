// src/components/dashboard/StudyPlanner.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

// Helper to get the current week ID in the format YYYY-W##
const getWeekId = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1.
  const week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  const weekNumber =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return `${date.getFullYear()}-W${weekNumber}`;
};

export default function StudyPlanner() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      const weekId = getWeekId();
      const planRef = doc(db, `users/${user.uid}/studyPlan`, weekId);
      const planSnap = await getDoc(planRef);

      if (planSnap.exists()) {
        setPlan(planSnap.data());
      }
      setLoading(false);
    };

    fetchPlan();
  }, [user]);

  const handleToggleTask = async (taskIndex) => {
    if (!plan) return;

    const newTasks = [...plan.tasks];
    newTasks[taskIndex].completed = !newTasks[taskIndex].completed;

    // Optimistic UI update
    setPlan((prev) => ({ ...prev, tasks: newTasks }));

    try {
      const weekId = getWeekId();
      const planRef = doc(db, `users/${user.uid}/studyPlan`, weekId);
      await updateDoc(planRef, { tasks: newTasks });
    } catch (error) {
      toast.error("Could not update task status.");
      // Revert UI on error
      newTasks[taskIndex].completed = !newTasks[taskIndex].completed;
      setPlan((prev) => ({ ...prev, tasks: newTasks }));
    }
  };

  if (loading) {
    return (
      <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-pulse'>
        <div className='h-8 bg-slate-200 rounded w-3/4 mb-4'></div>
        <div className='space-y-3'>
          <div className='h-6 bg-slate-200 rounded'></div>
          <div className='h-6 bg-slate-200 rounded'></div>
          <div className='h-6 bg-slate-200 rounded'></div>
        </div>
      </div>
    );
  }

  if (!plan || !plan.tasks || plan.tasks.length === 0) {
    return (
      <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
        <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3 mb-4'>
          <CalendarCheck className='text-purple-500' />
          Your Weekly Plan
        </h2>
        <p className='text-center text-slate-600 py-4'>
          Your personalized study plan for this week will appear here. Keep
          taking tests to generate recommendations!
        </p>
      </div>
    );
  }

  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
      <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3 mb-4'>
        <CalendarCheck className='text-purple-500' />
        Your Weekly Plan
      </h2>
      <div className='space-y-3'>
        {plan.tasks.map((task, index) => (
          <div
            key={index}
            className='flex items-center gap-3 p-3 bg-slate-50 rounded-lg'
          >
            <button onClick={() => handleToggleTask(index)}>
              <CheckCircle2
                className={`h-6 w-6 transition-colors ${
                  task.completed
                    ? "text-green-500 fill-green-100"
                    : "text-slate-300 hover:text-slate-400"
                }`}
              />
            </button>
            <div>
              <p
                className={`font-semibold ${
                  task.completed
                    ? "text-slate-400 line-through"
                    : "text-slate-800"
                }`}
              >
                {task.day}
              </p>
              <p
                className={`text-sm ${
                  task.completed
                    ? "text-slate-400 line-through"
                    : "text-slate-600"
                }`}
              >
                {task.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
