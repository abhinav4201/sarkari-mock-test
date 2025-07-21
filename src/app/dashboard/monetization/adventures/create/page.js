"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Save,
  X,
  GripVertical,
  HelpCircle,
  Book,
  List,
} from "lucide-react";
import AdventureHelpModal from "@/components/dashboard/AdventureHelpModal";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export default function CreateAdventurePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [myTests, setMyTests] = useState([]);
  const [isLoadingTests, setIsLoadingTests] = useState(true);

  const [adventure, setAdventure] = useState({
    title: "",
    description: "",
    examName: "",
    stages: [
      {
        name: "",
        creationMethod: "static", // Default to 'static' for users
        sourceTestId: "",
        topic: "",
        subject: "",
        questionCount: 10,
        unlockScore: 80,
      },
    ],
  });

  // Fetch the user's created tests to populate the dropdown
  useEffect(() => {
    if (!user) return;
    const fetchUserTests = async () => {
      try {
        const q = query(
          collection(db, "mockTests"),
          where("createdBy", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const userTests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMyTests(userTests);
      } catch (error) {
        toast.error("Could not load your existing mock tests.");
      } finally {
        setIsLoadingTests(false);
      }
    };
    fetchUserTests();
  }, [user]);

  const handleInputChange = (field, value) => {
    setAdventure((prev) => ({ ...prev, [field]: value }));
  };

  const handleStageChange = (index, field, value) => {
    const newStages = [...adventure.stages];
    newStages[index][field] = value;

    // If a test is selected, automatically populate the stage name
    if (field === "sourceTestId" && value) {
      const selectedTest = myTests.find((t) => t.id === value);
      if (selectedTest) {
        newStages[index].name = selectedTest.title;
        newStages[index].questionCount = selectedTest.questionCount;
      }
    }

    setAdventure((prev) => ({ ...prev, stages: newStages }));
  };

  const addStage = () => {
    const newStage = {
      name: "",
      creationMethod: "static",
      sourceTestId: "",
      topic: "",
      subject: "",
      questionCount: 10,
      unlockScore: 80,
    };
    setAdventure((prev) => ({ ...prev, stages: [...prev.stages, newStage] }));
  };

  const removeStage = (index) => {
    if (adventure.stages.length <= 1) {
      toast.error("An adventure must have at least one stage.");
      return;
    }
    const newStages = adventure.stages.filter((_, i) => i !== index);
    setAdventure((prev) => ({ ...prev, stages: newStages }));
  };

  const handleSave = async () => {
    if (!user) return toast.error("You must be logged in.");

    // Validation
    if (!adventure.title.trim() || !adventure.examName.trim()) {
      return toast.error("Please provide a title and target exam name.");
    }
    for (const stage of adventure.stages) {
      if (!stage.name.trim() || !stage.sourceTestId) {
        return toast.error(
          "All stages must have a name and a selected mock test."
        );
      }
    }

    const loadingToast = toast.loading("Saving your adventure...");
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/adventures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(adventure),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(data.message, { id: loadingToast });
      router.push("/dashboard/monetization");
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    }
  };

  return (
    <>
      <AdventureHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
      <div className='bg-slate-100 min-h-screen p-4 py-8'>
        <div className='container mx-auto max-w-4xl'>
          <div className='bg-white p-6 rounded-2xl text-slate-900 shadow-lg border'>
            <div className='flex justify-between items-center'>
              <h1 className='text-3xl font-bold'>Create New Adventure</h1>
              <button
                onClick={() => setIsHelpModalOpen(true)}
                className='flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200'
              >
                <HelpCircle size={16} />
                How does this work?
              </button>
            </div>
            <p className='mt-2 text-slate-600'>
              Build a step-by-step learning path using your existing mock tests
              as stages.
            </p>

            <div className='mt-8 space-y-4'>
              <input
                type='text'
                placeholder='Adventure Title (e.g., "Master SSC CGL Quant")'
                value={adventure.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className='w-full p-3 border rounded-lg'
              />
              <textarea
                placeholder='A short, engaging description for your adventure'
                value={adventure.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className='w-full p-3 border rounded-lg'
              />
              <input
                type='text'
                placeholder='Target Exam Name (e.g., SSC CGL)'
                value={adventure.examName}
                onChange={(e) => handleInputChange("examName", e.target.value)}
                className='w-full p-3 border rounded-lg'
              />
            </div>

            <h3 className='text-xl font-bold mt-8 mb-4'>Adventure Stages</h3>
            <div className='space-y-3'>
              {adventure.stages.map((stage, index) => (
                <div
                  key={index}
                  className='p-4 border rounded-lg bg-slate-50 flex items-start gap-3'
                >
                  <GripVertical className='h-5 w-5 text-slate-400 mt-4 flex-shrink-0 cursor-grab' />
                  <div className='flex-grow space-y-2'>
                    <label className='text-sm font-medium text-slate-700'>
                      Stage {index + 1}: Select a Mock Test
                    </label>
                    {isLoadingTests ? (
                      <p className='text-sm text-slate-500'>
                        Loading your tests...
                      </p>
                    ) : (
                      <select
                        value={stage.sourceTestId}
                        onChange={(e) =>
                          handleStageChange(
                            index,
                            "sourceTestId",
                            e.target.value
                          )
                        }
                        className='w-full p-2 border rounded-md bg-white'
                      >
                        <option value='' disabled>
                          -- Choose one of your tests --
                        </option>
                        {myTests.map((test) => (
                          <option key={test.id} value={test.id}>
                            {test.title}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type='text'
                      placeholder='Stage Name (auto-filled from test)'
                      value={stage.name}
                      onChange={(e) =>
                        handleStageChange(index, "name", e.target.value)
                      }
                      className='w-full p-2 border rounded-md'
                    />

                    <div className='flex gap-2'>
                      <div className='w-1/2'>
                        <label className='text-xs font-medium text-slate-600'>
                          No. of Questions
                        </label>
                        <input
                          type='number'
                          value={stage.questionCount}
                          disabled
                          className='w-full p-2 border rounded-md bg-slate-200 cursor-not-allowed'
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
                          className='w-full p-2 border rounded-md'
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeStage(index)}
                    className='p-2 text-red-500 hover:bg-red-100 rounded-full mt-3'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addStage}
              className='mt-4 px-4 py-2 text-sm bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200'
            >
              <Plus size={16} className='inline-block mr-1' /> Add Stage
            </button>

            <div className='flex justify-end gap-4 mt-8 pt-6 border-t'>
              <button
                onClick={() => router.back()}
                className='px-6 py-3 bg-slate-200 font-semibold rounded-lg flex items-center gap-1 hover:bg-slate-300'
              >
                <X size={16} /> Cancel
              </button>
              <button
                onClick={handleSave}
                className='px-6 py-3 bg-green-600 text-white font-semibold rounded-lg flex items-center gap-1 hover:bg-green-700'
              >
                <Save size={16} /> Save Adventure
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
