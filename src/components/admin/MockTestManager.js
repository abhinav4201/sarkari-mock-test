"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MockTestManager() {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [examName, setExamName] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Creating test...");

    try {
      const res = await fetch("/api/admin/mock-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          topic,
          subject,
          examName,
          estimatedTime: Number(estimatedTime),
          isPremium,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create test");
      }

      setStatus("Test created successfully! Refreshing...");
      // Clear form
      e.target.reset();
      setTitle("");
      setTopic("");
      setSubject("");
      setExamName("");
      setEstimatedTime(0);
      setIsPremium(false);
      // Refresh the page data to show the new test in the list
      router.refresh();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label className='block font-bold'>Test Title</label>
        <input
          type='text'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='w-full p-2 border rounded'
          required
        />
      </div>
      <div>
        <label className='block font-bold'>Topic</label>
        <input
          type='text'
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder='e.g., Indian History'
          className='w-full p-2 border rounded'
          required
        />
      </div>
      <div>
        <label className='block font-bold'>Subject</label>
        <input
          type='text'
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder='e.g., General Studies'
          className='w-full p-2 border rounded'
          required
        />
      </div>
      <div>
        <label className='block font-bold'>Exam Name</label>
        <input
          type='text'
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
          placeholder='e.g., SSC CGL'
          className='w-full p-2 border rounded'
        />
      </div>
      <div>
        <label className='block font-bold'>Estimated Time (in minutes)</label>
        <input
          type='number'
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(e.target.value)}
          className='w-full p-2 border rounded'
          required
        />
      </div>
      <div className='flex items-center'>
        <input
          type='checkbox'
          id='isPremium'
          checked={isPremium}
          onChange={(e) => setIsPremium(e.target.checked)}
          className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
        />
        <label htmlFor='isPremium' className='ml-2 block text-sm text-gray-900'>
          Is this a Premium Test?
        </label>
      </div>
      <button
        type='submit'
        className='w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
        disabled={status.includes("Creating")}
      >
        Create Test
      </button>
      {status && <p className='mt-2 text-center'>{status}</p>}
    </form>
  );
}
