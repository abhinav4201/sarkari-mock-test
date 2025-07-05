"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

export default function MockTestManager() {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [examName, setExamName] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading("Creating new test...");

    try {
      // Write directly to the 'mockTests' collection from the client
      await addDoc(collection(db, "mockTests"), {
        title,
        topic,
        subject,
        examName,
        estimatedTime: Number(estimatedTime),
        isPremium,
        questionCount: 0,
        createdAt: serverTimestamp(),
      });

      toast.success("Test created successfully!", { id: loadingToast });
      e.target.reset();
      setTitle("");
      setTopic("");
      setSubject("");
      setExamName("");
      setEstimatedTime(0);
      setIsPremium(false);
      router.refresh(); // Refresh the page to show the new test in the list
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
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
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500'
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
          placeholder='e.g., Indian History'
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500'
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
          placeholder='e.g., General Studies'
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500'
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
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500'
        />
      </div>
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
