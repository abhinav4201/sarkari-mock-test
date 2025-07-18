"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function UserTestCreator({ onTestCreated }) {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [examName, setExamName] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(10); // Default to a sensible value
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (title.trim().length < 10)
      newErrors.title = "Title must be at least 10 characters long.";
    if (topic.trim().length < 3)
      newErrors.topic = "Topic must be at least 3 characters long.";
    if (subject.trim().length < 3)
      newErrors.subject = "Subject must be at least 3 characters long.";
    if (Number(estimatedTime) <= 0)
      newErrors.estimatedTime = "Estimated time must be greater than 0.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in.");
    if (!validate()) return toast.error("Please fix the errors in the form.");

    setIsLoading(true);
    const loadingToast = toast.loading("Creating your test shell...");

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/tests/submit-for-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title,
          topic,
          subject,
          examName,
          estimatedTime: Number(estimatedTime),
          isPremium: isPremiumTest,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      const { newTestId } = data;
      if (!newTestId) throw new Error("Could not retrieve the new test ID.");

      toast.success("Test details saved! Now add questions.", {
        id: loadingToast,
      });

      // Redirect to the new page
      router.push(`/dashboard/monetization/${newTestId}`);
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  const errorClass = "border-red-500 focus:ring-red-500 focus:border-red-500";
  const baseClass =
    "w-full p-3 border border-slate-300 rounded-lg text-slate-900 focus:ring-indigo-500 focus:border-indigo-500";

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <label
          htmlFor='user-test-title'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Test Title
        </label>
        <input
          id='user-test-title'
          type='text'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${baseClass} ${errors.title ? errorClass : ""}`}
          required
        />
        {errors.title && (
          <p className='mt-1 text-sm text-red-600'>{errors.title}</p>
        )}
      </div>
      <div>
        <label
          htmlFor='user-test-topic'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Topic
        </label>
        <input
          id='user-test-topic'
          type='text'
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder='e.g., Indian History'
          className={`${baseClass} ${errors.topic ? errorClass : ""}`}
          required
        />
        {errors.topic && (
          <p className='mt-1 text-sm text-red-600'>{errors.topic}</p>
        )}
      </div>
      <div>
        <label
          htmlFor='user-test-subject'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Subject
        </label>
        <input
          id='user-test-subject'
          type='text'
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder='e.g., General Studies'
          className={`${baseClass} ${errors.subject ? errorClass : ""}`}
          required
        />
        {errors.subject && (
          <p className='mt-1 text-sm text-red-600'>{errors.subject}</p>
        )}
      </div>
      <div>
        <label
          htmlFor='user-test-exam'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Exam Name (Optional)
        </label>
        <input
          id='user-test-exam'
          type='text'
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
          placeholder='e.g., SSC CGL'
          className={baseClass}
        />
      </div>
      <div>
        <label
          htmlFor='user-test-time'
          className='block text-sm font-medium text-slate-900 mb-1'
        >
          Estimated Time (in minutes)
        </label>
        <input
          id='user-test-time'
          type='number'
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(e.target.value)}
          className={`${baseClass} ${errors.estimatedTime ? errorClass : ""}`}
          required
          min='1'
        />
        {errors.estimatedTime && (
          <p className='mt-1 text-sm text-red-600'>{errors.estimatedTime}</p>
        )}
      </div>
      {userProfile?.monetizationStatus === "approved" && (
        <div className='pt-2'>
          <div className='flex items-center'>
            <input
              type='checkbox'
              id='isPremiumTest'
              checked={isPremiumTest}
              onChange={(e) => setIsPremiumTest(e.target.checked)}
              className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
            />
            <label
              htmlFor='isPremiumTest'
              className='ml-3 block text-sm font-medium text-slate-900'
            >
              Mark this as a Premium Test? (Exclusive for subscribers)
            </label>
          </div>
        </div>
      )}
      <button
        type='submit'
        className='w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400'
        disabled={isLoading}
      >
        {isLoading ? "Submitting..." : "Submit Test for Approval"}
      </button>
    </form>
  );
}
