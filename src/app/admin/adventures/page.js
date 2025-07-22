// src/app/admin/adventures/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import toast from "react-hot-toast";
import { Plus, Edit, Trash2, Save, X, GripVertical } from "lucide-react";
import TestSearchModal from "@/components/admin/TestSearchModal"; // <-- NEW IMPORT

export default function AdminAdventuresPage() {
  const { user } = useAuth();
  const [adventures, setAdventures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAdventure, setCurrentAdventure] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false); // <-- NEW STATE
  const [editingStageIndex, setEditingStageIndex] = useState(null); // <-- NEW STATE

  const fetchAdventures = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "adventures"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      setAdventures(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      toast.error("Failed to load adventures.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdventures();
  }, [fetchAdventures]);

  const handleAddNew = () => {
    setCurrentAdventure({
      title: "",
      description: "",
      examName: "",
      stages: [],
    });
    setIsEditing(true);
  };

  const handleEdit = (adventure) => {
    setCurrentAdventure(JSON.parse(JSON.stringify(adventure)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentAdventure(null);
  };

  const handleSave = async () => {
    if (!user) return toast.error("Admin not authenticated.");
    const loadingToast = toast.loading("Saving adventure...");
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/adventures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(currentAdventure),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message, { id: loadingToast });
      setIsEditing(false);
      setCurrentAdventure(null);
      fetchAdventures();
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    }
  };

  const handleTestSelect = (test) => {
    if (editingStageIndex === null) return;
    const newStages = [...currentAdventure.stages];
    newStages[editingStageIndex].sourceTestId = test.id;
    newStages[editingStageIndex].name = test.title; // Auto-fill name
    setCurrentAdventure((prev) => ({ ...prev, stages: newStages }));
    setEditingStageIndex(null);
  };

  const handleStageChange = (index, field, value) => {
    const newStages = [...currentAdventure.stages];
    newStages[index][field] = value;
    if (field === "creationMethod") {
      newStages[index].sourceTestId = "";
      newStages[index].topic = "";
      newStages[index].subject = "";
    }
    setCurrentAdventure((prev) => ({ ...prev, stages: newStages }));
  };

  const addStage = () => {
    const newStage = {
      name: "",
      creationMethod: "dynamic",
      sourceTestId: "",
      topic: "",
      subject: "",
      questionCount: 10,
      unlockScore: 80,
    };
    setCurrentAdventure((prev) => ({
      ...prev,
      stages: [...prev.stages, newStage],
    }));
  };

  const removeStage = (index) => {
    const newStages = currentAdventure.stages.filter((_, i) => i !== index);
    setCurrentAdventure((prev) => ({ ...prev, stages: newStages }));
  };

  if (loading)
    return <div className='text-center p-8'>Loading Adventures...</div>;

  if (isEditing) {
    return (
      <>
        <TestSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onTestSelect={handleTestSelect}
        />
        <div className='bg-white p-6 rounded-2xl text-slate-900 shadow-lg border'>
          <h2 className='text-2xl font-bold mb-4'>
            {currentAdventure.id ? "Edit Adventure" : "Create New Adventure"}
          </h2>
          <div className='space-y-4'>
            <input
              type='text'
              placeholder='Adventure Title'
              value={currentAdventure.title}
              onChange={(e) =>
                setCurrentAdventure({
                  ...currentAdventure,
                  title: e.target.value,
                })
              }
              className='w-full p-2 border rounded'
            />
            <textarea
              placeholder='Description'
              value={currentAdventure.description}
              onChange={(e) =>
                setCurrentAdventure({
                  ...currentAdventure,
                  description: e.target.value,
                })
              }
              className='w-full p-2 border rounded'
            />
            <input
              type='text'
              placeholder='Exam Name (e.g., SSC CGL)'
              value={currentAdventure.examName}
              onChange={(e) =>
                setCurrentAdventure({
                  ...currentAdventure,
                  examName: e.target.value,
                })
              }
              className='w-full p-2 border rounded'
            />
          </div>
          <h3 className='text-xl font-bold mt-6 mb-2'>Stages</h3>
          <div className='space-y-3'>
            {currentAdventure.stages.map((stage, index) => (
              <div
                key={index}
                className='p-3 border rounded-lg bg-slate-50 flex items-start gap-2'
              >
                <GripVertical className='h-5 w-5 text-slate-400 mt-1 flex-shrink-0' />
                <div className='flex-grow space-y-2'>
                  <input
                    type='text'
                    placeholder='Stage Name'
                    value={stage.name}
                    onChange={(e) =>
                      handleStageChange(index, "name", e.target.value)
                    }
                    className='w-full p-1 border rounded'
                  />

                  <select
                    value={stage.creationMethod || "dynamic"}
                    onChange={(e) =>
                      handleStageChange(index, "creationMethod", e.target.value)
                    }
                    className='w-full p-1 border rounded bg-white'
                  >
                    <option value='dynamic'>
                      Dynamic (from Question Bank)
                    </option>
                    <option value='static'>Static (from Existing Test)</option>
                  </select>

                  {stage.creationMethod === "static" ? (
                    <div className='p-2 border border-slate-300 rounded-md bg-white'>
                      {stage.sourceTestId ? (
                        <div className='flex justify-between items-center'>
                          <span className='text-slate-800'>{stage.name}</span>
                          <button
                            type='button'
                            onClick={() => {
                              setEditingStageIndex(index);
                              setIsSearchModalOpen(true);
                            }}
                            className='text-sm text-indigo-600 hover:underline'
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          type='button'
                          onClick={() => {
                            setEditingStageIndex(index);
                            setIsSearchModalOpen(true);
                          }}
                          className='w-full text-indigo-600 font-semibold'
                        >
                          Select a Test for this Stage
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <input
                        type='text'
                        placeholder='Topic (from Question Bank)'
                        value={stage.topic}
                        onChange={(e) =>
                          handleStageChange(index, "topic", e.target.value)
                        }
                        className='w-full p-1 border rounded'
                      />
                      <input
                        type='text'
                        placeholder='Subject (from Question Bank)'
                        value={stage.subject}
                        onChange={(e) =>
                          handleStageChange(index, "subject", e.target.value)
                        }
                        className='w-full p-1 border rounded'
                      />
                    </>
                  )}

                  <div className='flex gap-2'>
                    <div className='w-1/2'>
                      <label className='text-xs font-medium text-slate-600'>
                        No. of Questions
                      </label>
                      <input
                        type='number'
                        value={stage.questionCount}
                        onChange={(e) =>
                          handleStageChange(
                            index,
                            "questionCount",
                            Number(e.target.value)
                          )
                        }
                        className='w-full p-1 border rounded'
                      />
                    </div>
                    <div className='w-1/2'>
                      <label className='text-xs font-medium text-slate-600'>
                        Passing Score %
                      </label>
                      <input
                        type='number'
                        value={stage.unlockScore}
                        onChange={(e) =>
                          handleStageChange(
                            index,
                            "unlockScore",
                            Number(e.target.value)
                          )
                        }
                        className='w-full p-1 border rounded'
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeStage(index)}
                  className='p-2 text-red-500 hover:bg-red-100 rounded-full'
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addStage}
            className='mt-4 px-4 py-2 text-sm bg-blue-100 text-blue-700 font-semibold rounded-lg'
          >
            + Add Stage
          </button>
          <div className='flex justify-end gap-4 mt-6'>
            <button
              onClick={handleCancel}
              className='px-5 py-2 bg-slate-200 font-semibold rounded-lg flex items-center gap-1'
            >
              <X size={16} /> Cancel
            </button>
            <button
              onClick={handleSave}
              className='px-5 py-2 bg-green-600 text-white font-semibold rounded-lg flex items-center gap-1'
            >
              <Save size={16} /> Save Adventure
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div>
      <div className='flex justify-between text-slate-900 items-center mb-6'>
        <h1 className='text-3xl font-bold text-slate-900'>Exam Adventures</h1>
        <button
          onClick={handleAddNew}
          className='px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg flex items-center gap-2'
        >
          <Plus size={16} /> Add New Adventure
        </button>
      </div>
      <div className='bg-white p-6 rounded-2xl shadow-lg border'>
        {adventures.length > 0 ? (
          <div className='space-y-3'>
            {adventures.map((adv) => (
              <div
                key={adv.id}
                className='p-4 border rounded-lg flex justify-between items-center'
              >
                <div>
                  <h3 className='font-bold text-lg text-slate-800'>
                    {adv.title}
                  </h3>
                  <p className='text-sm text-slate-600'>
                    {adv.examName} - {adv.stages?.length || 0} stages
                  </p>
                </div>
                <button
                  onClick={() => handleEdit(adv)}
                  className='p-2 text-slate-600 hover:bg-slate-100 rounded-lg'
                >
                  <Edit size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-center text-slate-600 py-8'>
            No adventures created yet. Click "Add New Adventure" to start.
          </p>
        )}
      </div>
    </div>
  );
}
