"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { cacheTests } from "@/lib/indexedDb";
import toast from "react-hot-toast";
import { Plane, DownloadCloud, WifiOff } from "lucide-react";
import Modal from "../ui/Modal";
import { db } from "@/lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";

// --- NEW: Options Modal Component ---
const TravelingModeModal = ({ isOpen, onClose, onActivate }) => {
  const [duration, setDuration] = useState(30); // Default to 30 minutes
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [allTopics, setAllTopics] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch all unique topics and subjects to populate dropdowns
    const fetchMetadata = async () => {
      const testsSnapshot = await getDocs(query(collection(db, "mockTests")));
      const topics = new Set();
      const subjects = new Set();
      testsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.topic) topics.add(data.topic);
        if (data.subject) subjects.add(data.subject);
      });
      setAllTopics(Array.from(topics));
      setAllSubjects(Array.from(subjects));
    };
    fetchMetadata();
  }, []);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onActivate({ duration, topic, subject });
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Configure Traveling Mode'>
      <div className='p-6 space-y-6'>
        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>
            How long is your trip?
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className='w-full p-2 border border-slate-300 rounded-md text-slate-900'
          >
            <option value={30}>30 Minutes</option>
            <option value={60}>1 Hour</option>
            <option value={120}>2 Hours</option>
            <option value={240}>4 Hours</option>
          </select>
          <p className='text-xs text-slate-500 mt-1'>
            We'll download enough tests to fill this time.
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>
            Preferred Topic (Optional)
          </label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className='w-full p-2 border border-slate-300 rounded-md text-slate-900'
          >
            <option value=''>Any Topic</option>
            {allTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-slate-700 mb-1'>
            Preferred Subject (Optional)
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className='w-full p-2 border border-slate-300 rounded-md text-slate-900'
          >
            <option value=''>Any Subject</option>
            {allSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className='pt-4'>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400'
          >
            {isLoading ? (
              <>
                <DownloadCloud className='animate-pulse h-5 w-5' />
                Preparing Offline Tests...
              </>
            ) : (
              <>
                <WifiOff className='h-5 w-5' />
                Activate & Download
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// --- Main TravelingModeCard Component ---
export default function TravelingModeCard() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleActivate = async (preferences) => {
    if (!user) return toast.error("Please log in to use Traveling Mode.");
    const loadingToast = toast.loading("Finding and downloading tests...");

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/tests/for-offline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(preferences), // Send user preferences
      });

      if (!res.ok) throw new Error("Could not fetch tests for offline use.");

      const { tests, questions } = await res.json();

      if (tests.length === 0) {
        toast.success("You're all caught up! No new tests to download.", {
          id: loadingToast,
        });
        return;
      }

      const testsToCache = tests.map((test) => ({
        ...test,
        questions: questions.filter((q) => q.testId === test.id),
      }));

      await cacheTests(testsToCache);

      toast.success(`${tests.length} test(s) are now available offline!`, {
        id: loadingToast,
        duration: 4000,
      });
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    }
  };

  return (
    <>
      <TravelingModeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onActivate={handleActivate}
      />
      <div className='mt-8 bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
        <div className='flex items-center gap-3'>
          <div className='bg-sky-100 p-3 rounded-full'>
            <Plane className='h-6 w-6 text-sky-600' />
          </div>
          <div>
            <h2 className='text-2xl font-bold text-slate-900'>
              Traveling Mode
            </h2>
            <p className='text-slate-600'>No internet? No problem.</p>
          </div>
        </div>
        <p className='mt-4 text-slate-700'>
          Tell us how long you'll be offline, and we'll download a curated set
          of tests for you. Your results will sync automatically when you're
          back online.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className='w-full mt-6 px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 flex items-center justify-center gap-2'
        >
          <WifiOff className='h-5 w-5' />
          Activate Traveling Mode
        </button>
      </div>
    </>
  );
}
