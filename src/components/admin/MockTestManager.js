// src/components/admin/MockTestManager.js
"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

// The component accepts the onTestCreated function as a prop.
export default function MockTestManager({ onTestCreated }) {
  // Your original state variables are preserved.
  const [testType, setTestType] = useState("static");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [examName, setExamName] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [isHidden, setIsHidden] = useState(false); // <-- ADDED
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Your validation logic is preserved.
    if (Number(estimatedTime) <= 0) {
      toast.error("Estimated time must be greater than 0.");
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Creating new test...");

    try {
      const initialLikeCount = Math.floor(10000 + Math.random() * 90000);

      const isDynamicTest = testType === "dynamic";
      const testData = {
        title,
        title_lowercase: title.toLowerCase(),
        topic,
        subject,
        examName: examName || "",
        estimatedTime: Number(estimatedTime),
        isPremium,
        isHidden: isHidden || false, // <-- ADDED
        createdAt: serverTimestamp(),
        isDynamic: isDynamicTest,
        likeCount: initialLikeCount,
        takenCount: 0, // NEW: Initialize takenCount here
      };

      if (isDynamicTest) {
        testData.questionCount = Number(questionCount);
        testData.sourceCriteria = { topic, subject };
      } else {
        testData.questionCount = 0;
      }

      await addDoc(collection(db, "mockTests"), testData);

      toast.success("Test created successfully!", { id: loadingToast });
      e.target.reset();
      setTitle("");
      setTopic("");
      setSubject("");
      setExamName("");
      setEstimatedTime(0);
      setIsPremium(false);
      setIsHidden(false); // <-- ADDED
      setQuestionCount(10);

      // --- THIS IS THE CORRECTED REFRESH LOGIC ---
      // This calls the function passed from the parent page to trigger an instant data refresh.
      if (onTestCreated) {
        onTestCreated();
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  // Your original form structure is preserved, with the addition of the Test Type toggle.
  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Test Type
        </label>
        <div className='flex gap-4 rounded-lg bg-slate-200 p-1'>
          <button
            type='button'
            onClick={() => setTestType("static")}
            className={`w-full p-2 rounded-md font-semibold text-sm ${
              testType === "static"
                ? "bg-white text-indigo-600 shadow"
                : "text-slate-600"
            }`}
          >
            Static Test
          </button>
          <button
            type='button'
            onClick={() => setTestType("dynamic")}
            className={`w-full p-2 rounded-md font-semibold text-sm ${
              testType === "dynamic"
                ? "bg-white text-indigo-600 shadow"
                : "text-slate-600"
            }`}
          >
            Dynamic Test
          </button>
        </div>
      </div>
      <div>
        <label
          htmlFor='test-title'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Test Title
        </label>
        <input
          id='test-title'
          type='text'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
        />
      </div>
      <div>
        <label
          htmlFor='test-topic'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Topic
        </label>
        <input
          id='test-topic'
          type='text'
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={
            testType === "dynamic"
              ? "Criteria for question bank"
              : "e.g., Indian History"
          }
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
        />
      </div>
      <div>
        <label
          htmlFor='test-subject'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Subject
        </label>
        <input
          id='test-subject'
          type='text'
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={
            testType === "dynamic"
              ? "Criteria for question bank"
              : "e.g., General Studies"
          }
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
        />
      </div>
      <div>
        <label
          htmlFor='test-exam'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Exam Name
        </label>
        <input
          id='test-exam'
          type='text'
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
          placeholder='e.g., SSC CGL'
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
        />
      </div>
      {testType === "dynamic" && (
        <div>
          <label
            htmlFor='q-count'
            className='block text-sm font-medium text-slate-900 mb-1'
          >
            Number of Questions to Draw
          </label>
          <input
            id='q-count'
            type='number'
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
            className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
            required
            min='1'
          />
        </div>
      )}
      <div>
        <label
          htmlFor='test-time'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Estimated Time (in minutes)
        </label>
        <input
          id='test-time'
          type='number'
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(e.target.value)}
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
          min='1'
        />
      </div>
      <div className='flex items-center'>
        <input
          type='checkbox'
          id='isPremium'
          checked={isPremium}
          onChange={(e) => setIsPremium(e.target.checked)}
          className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
        />
        <label
          htmlFor='isPremium'
          className='ml-2 block text-sm text-slate-900'
        >
          Is this a Premium Test?
        </label>
      </div>
      {/* ADDED CHECKBOX FOR isHidden */}
      <div className='pt-2'>
        <div className='flex items-center'>
          <input
            type='checkbox'
            id='isHidden'
            checked={isHidden}
            onChange={(e) => setIsHidden(e.target.checked)}
            className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
          />
          <label
            htmlFor='isHidden'
            className='ml-3 block text-sm font-medium text-slate-900'
          >
            Hide from public Test Hub?
          </label>
        </div>
        <p className='text-xs text-slate-500 ml-7'>
          Use this for tests that are part of a Live Test or Exam Adventure.
        </p>
      </div>
      <button
        type='submit'
        className='w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400'
        disabled={isLoading}
      >
        {isLoading ? "Creating..." : "Create Test"}
      </button>
    </form>
  );
}
