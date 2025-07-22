"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Trophy, Plus, Settings } from "lucide-react";
import TestSearchModal from "@/components/admin/TestSearchModal"; // <-- NEW IMPORT

export default function AdminLiveTestsPage() {
  const [liveTests, setLiveTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false); // <-- NEW STATE

  // Form State
  const [title, setTitle] = useState("");
  const [sourceTestId, setSourceTestId] = useState("");
  const [sourceTestTitle, setSourceTestTitle] = useState(""); // <-- NEW STATE
  const [entryFee, setEntryFee] = useState(50);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [prizeModel, setPrizeModel] = useState("dynamic");
  const [prizeCap, setPrizeCap] = useState(10000);

  useEffect(() => {
    const fetchLiveTests = async () => {
      setIsLoading(true);
      const q = query(
        collection(db, "liveTests"),
        orderBy("startTime", "desc")
      );
      const snapshot = await getDocs(q);
      setLiveTests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    };
    fetchLiveTests();
  }, []);

  const handleTestSelect = (test) => {
    setSourceTestId(test.id);
    setSourceTestTitle(test.title);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !sourceTestId || !startTime || !endTime) {
      return toast.error(
        "Please fill all required fields, including selecting a source test."
      );
    }

    try {
      const newEventData = {
        title,
        sourceTestId,
        entryFee: Number(entryFee),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "scheduled",
        participantCount: 0,
        totalPot: 0,
        prizeModel,
        createdAt: serverTimestamp(),
      };

      if (prizeModel === "fixed_cap") {
        newEventData.prizeCap = Number(prizeCap);
      }

      await addDoc(collection(db, "liveTests"), newEventData);
      toast.success("Live Test event created successfully!");
      e.target.reset();
      setSourceTestId(""); // Clear selection
      setSourceTestTitle(""); // Clear selection
      const q = query(
        collection(db, "liveTests"),
        orderBy("startTime", "desc")
      );
      const snapshot = await getDocs(q);
      setLiveTests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error("Failed to create event.");
    }
  };

  return (
    <>
      <TestSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onTestSelect={handleTestSelect}
      />
      <div>
        <h1 className='text-3xl font-bold text-slate-900 mb-6'>
          Live Pool Tests Management
        </h1>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
          <div className='lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border'>
            <h2 className='text-xl font-bold text-slate-800 mb-4 flex items-center gap-2'>
              <Plus /> Create New Live Test
            </h2>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  Event Title
                </label>
                <input
                  type='text'
                  onChange={(e) => setTitle(e.target.value)}
                  className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  Source Mock Test
                </label>
                <div className='mt-1 p-2 border border-slate-300 rounded-md bg-slate-50 min-h-[40px]'>
                  {sourceTestTitle ? (
                    <div className='flex justify-between items-center'>
                      <span className='text-slate-800'>{sourceTestTitle}</span>
                      <button
                        type='button'
                        onClick={() => setIsSearchModalOpen(true)}
                        className='text-sm text-indigo-600 hover:underline'
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      type='button'
                      onClick={() => setIsSearchModalOpen(true)}
                      className='w-full text-indigo-600 font-semibold'
                    >
                      Select a Test
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  Entry Fee (₹)
                </label>
                <input
                  type='number'
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  Start Time
                </label>
                <input
                  type='datetime-local'
                  onChange={(e) => setStartTime(e.target.value)}
                  className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  End Time
                </label>
                <input
                  type='datetime-local'
                  onChange={(e) => setEndTime(e.target.value)}
                  className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  Prize Model
                </label>
                <select
                  value={prizeModel}
                  onChange={(e) => setPrizeModel(e.target.value)}
                  className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                >
                  <option value='dynamic'>Dynamic Prize Pool</option>
                  <option value='fixed_cap'>Fixed Prize Cap</option>
                </select>
              </div>
              {prizeModel === "fixed_cap" && (
                <div>
                  <label className='block text-sm font-medium text-slate-700'>
                    Prize Cap Amount (₹)
                  </label>
                  <input
                    type='number'
                    value={prizeCap}
                    onChange={(e) => setPrizeCap(e.target.value)}
                    className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                  />
                </div>
              )}
              <button
                type='submit'
                className='w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700'
              >
                Create Event
              </button>
            </form>
          </div>
          <div className='lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border'>
            <h2 className='text-xl font-bold text-slate-800 mb-4'>
              Scheduled & Past Events
            </h2>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <div className='space-y-3'>
                {liveTests.map((test) => (
                  <div key={test.id} className='p-4 border rounded-lg'>
                    <p className='font-semibold text-slate-800'>{test.title}</p>
                    <p className='text-sm text-slate-500'>
                      Status:{" "}
                      <span className='font-medium text-indigo-600'>
                        {test.status}
                      </span>
                    </p>
                    <p className='text-sm text-slate-500'>
                      Starts: {test.startTime.toDate().toLocaleString()}
                    </p>
                    <p className='text-sm text-slate-500'>
                      Participants: {test.participantCount || 0}
                    </p>
                    {test.status === "live" && (
                      <button className='text-xs font-bold text-red-500 mt-2'>
                        CALCULATE WINNERS (MANUAL TRIGGER)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
