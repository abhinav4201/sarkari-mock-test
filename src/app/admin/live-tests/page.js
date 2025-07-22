"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Trophy, Plus, Edit, X } from "lucide-react";
import TestSearchModal from "@/components/admin/TestSearchModal";

export default function AdminLiveTestsPage() {
  const [liveTests, setLiveTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Unified state for the form
  const [isEditing, setIsEditing] = useState(false);
  const [currentTestId, setCurrentTestId] = useState(null);
  const [title, setTitle] = useState("");
  const [sourceTestId, setSourceTestId] = useState("");
  const [sourceTestTitle, setSourceTestTitle] = useState("");
  const [entryFee, setEntryFee] = useState(50);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [prizeModel, setPrizeModel] = useState("dynamic");
  const [prizeCap, setPrizeCap] = useState(10000);
  const [isFree, setIsFree] = useState(false);
  const [bonusCoinPrize, setBonusCoinPrize] = useState(3);

  const fetchLiveTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "liveTests"),
        orderBy("startTime", "desc")
      );
      const snapshot = await getDocs(q);
      setLiveTests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error("Failed to fetch live test events.");
      console.error("Fetch Live Tests Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveTests();
  }, [fetchLiveTests]);

  const resetForm = () => {
    setIsEditing(false);
    setCurrentTestId(null);
    setTitle("");
    setSourceTestId("");
    setSourceTestTitle("");
    setEntryFee(50);
    setStartTime("");
    setEndTime("");
    setPrizeModel("dynamic");
    setPrizeCap(10000);
    setIsFree(false);
    setBonusCoinPrize(3);
  };

  const handleEditClick = (test) => {
    setIsEditing(true);
    setCurrentTestId(test.id);
    setTitle(test.title);
    setSourceTestId(test.sourceTestId);
    setSourceTestTitle(`ID: ${test.sourceTestId}`); // Placeholder, ideally fetch title
    setEntryFee(test.entryFee);

    const formatForInput = (date) => {
      const d = date.toDate();
      const adjustedDate = new Date(
        d.getTime() - d.getTimezoneOffset() * 60000
      );
      return adjustedDate.toISOString().slice(0, 16);
    };

    setStartTime(formatForInput(test.startTime));
    setEndTime(formatForInput(test.endTime));
    setPrizeModel(test.prizeModel || "dynamic");
    setPrizeCap(test.prizeCap || 10000);
    setIsFree(test.isFree || false);
    setBonusCoinPrize(test.bonusCoinPrize || 3);
  };

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

    const eventData = {
      title,
      sourceTestId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isFree,
      entryFee: isFree ? 0 : Number(entryFee),
      bonusCoinPrize: isFree ? Number(bonusCoinPrize) : 0,
      prizeModel: isFree ? "none" : prizeModel,
      prizeCap: prizeModel === "fixed_cap" && !isFree ? Number(prizeCap) : 0,
    };

    try {
      if (isEditing) {
        const docRef = doc(db, "liveTests", currentTestId);
        await updateDoc(docRef, eventData);
        toast.success("Live Test event updated successfully!");
      } else {
        await addDoc(collection(db, "liveTests"), {
          ...eventData,
          status: "scheduled",
          participantCount: 0,
          totalPot: 0,
          createdAt: serverTimestamp(),
        });
        toast.success("Live Test event created successfully!");
      }
      resetForm();
      fetchLiveTests();
    } catch (error) {
      toast.error(`Failed to ${isEditing ? "update" : "create"} event.`);
      console.error("Submit Error:", error);
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
              {isEditing ? <Edit /> : <Plus />}{" "}
              {isEditing ? "Edit Live Test" : "Create New Live Test"}
            </h2>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  Event Title
                </label>
                <input
                  type='text'
                  value={title}
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
                      <span className='text-slate-800 truncate pr-2'>
                        {sourceTestTitle}
                      </span>
                      <button
                        type='button'
                        onClick={() => setIsSearchModalOpen(true)}
                        className='text-sm text-indigo-600 hover:underline flex-shrink-0'
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
              <div className='flex items-center pt-2'>
                <input
                  type='checkbox'
                  id='isFree'
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                />
                <label
                  htmlFor='isFree'
                  className='ml-2 block text-sm font-medium text-slate-900'
                >
                  Free to Enter (Awards Bonus Coins)
                </label>
              </div>

              {isFree ? (
                <div>
                  <label className='block text-sm font-medium text-slate-700'>
                    Bonus Coin Prize (for participation)
                  </label>
                  <input
                    type='number'
                    value={bonusCoinPrize}
                    onChange={(e) => setBonusCoinPrize(e.target.value)}
                    className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                    required
                  />
                </div>
              ) : (
                <>
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
                </>
              )}
              <div>
                <label className='block text-sm font-medium text-slate-700'>
                  Start Time
                </label>
                <input
                  type='datetime-local'
                  value={startTime}
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
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                  required
                />
              </div>
              <div className='flex gap-2 pt-2'>
                {isEditing && (
                  <button
                    type='button'
                    onClick={resetForm}
                    className='w-full flex justify-center items-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg'
                  >
                    <X size={16} />
                    Cancel
                  </button>
                )}
                <button
                  type='submit'
                  className='w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700'
                >
                  {isEditing ? "Update Event" : "Create Event"}
                </button>
              </div>
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
                  <div
                    key={test.id}
                    className='p-4 border rounded-lg flex justify-between items-center'
                  >
                    <div>
                      <p className='font-semibold text-slate-800'>
                        {test.title}{" "}
                        {test.isFree && (
                          <span className='text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full ml-2'>
                            FREE
                          </span>
                        )}
                      </p>
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
                    </div>
                    <div className='flex items-center gap-2'>
                      {new Date() < test.endTime.toDate() && (
                        <button
                          onClick={() => handleEditClick(test)}
                          className='p-2 text-slate-500 hover:bg-slate-100 rounded-lg'
                          title='Edit Event'
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {test.status === "live" && (
                        <button className='text-xs font-bold text-red-500 p-2 rounded-lg hover:bg-red-100'>
                          CALCULATE WINNERS
                        </button>
                      )}
                    </div>
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
