"use client";

import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function EditTestModal({
  isOpen,
  onClose,
  test,
  onTestUpdated,
}) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [examName, setExamName] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [questionCount, setQuestionCount] = useState(10);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (test) {
      setTitle(test.title || "");
      setExamName(test.examName || "");
      setEstimatedTime(test.estimatedTime || 0);
      setIsPremium(test.isPremium || false);
      if (test.isDynamic) {
        setTopic(test.sourceCriteria?.topic || "");
        setSubject(test.sourceCriteria?.subject || "");
        setQuestionCount(test.questionCount || 10);
      } else {
        setTopic(test.topic || "");
        setSubject(test.subject || "");
      }
    }
  }, [test]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!test) return;
    if (Number(estimatedTime) <= 0) {
      return toast.error("Estimated time must be greater than 0.");
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Updating test...");

    try {
      const testRef = doc(db, "mockTests", test.id);

      const updatedData = {
        title,
        title_lowercase: title.toLowerCase(), // --- THIS IS THE FIX ---
        examName,
        estimatedTime: Number(estimatedTime),
        isPremium,
      };

      if (test.isDynamic) {
        updatedData.sourceCriteria = { topic, subject };
        updatedData.questionCount = Number(questionCount);
      } else {
        updatedData.topic = topic;
        updatedData.subject = subject;
      }

      await updateDoc(testRef, updatedData);

      toast.success("Test updated successfully!", { id: loadingToast });
      onClose();
      if (onTestUpdated) {
        onTestUpdated();
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Test: ${test.title}`}>
      <form onSubmit={handleUpdate} className='p-6 space-y-6'>
        <div>
          <label
            htmlFor='edit-test-title'
            className='block text-sm font-medium text-slate-900 mb-1'
          >
            Test Title
          </label>
          <input
            id='edit-test-title'
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
            required
          />
        </div>
        <div>
          <label
            htmlFor='edit-test-topic'
            className='block text-sm font-medium text-slate-900 mb-1'
          >
            Topic
          </label>
          <input
            id='edit-test-topic'
            type='text'
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
            required
          />
        </div>
        <div>
          <label
            htmlFor='edit-test-subject'
            className='block text-sm font-medium text-slate-900 mb-1'
          >
            Subject
          </label>
          <input
            id='edit-test-subject'
            type='text'
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
            required
          />
        </div>
        <div>
          <label
            htmlFor='edit-test-exam'
            className='block text-sm font-medium text-slate-900 mb-1'
          >
            Exam Name
          </label>
          <input
            id='edit-test-exam'
            type='text'
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          />
        </div>
        <div>
          <label
            htmlFor='edit-test-time'
            className='block text-sm font-medium text-slate-900 mb-1'
          >
            Estimated Time (in minutes)
          </label>
          <input
            id='edit-test-time'
            type='number'
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(e.target.value)}
            className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
            required
            min='1'
          />
        </div>
        {test.isDynamic && (
          <div>
            <label
              htmlFor='edit-q-count'
              className='block text-sm font-medium text-slate-900 mb-1'
            >
              Number of Questions to Draw
            </label>
            <input
              id='edit-q-count'
              type='number'
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
              className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
              required
              min='1'
            />
          </div>
        )}
        <div className='flex items-center'>
          <input
            type='checkbox'
            id='edit-isPremium'
            checked={isPremium}
            onChange={(e) => setIsPremium(e.target.checked)}
            className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
          />
          <label
            htmlFor='edit-isPremium'
            className='ml-2 block text-sm text-slate-900'
          >
            Is this a Premium Test?
          </label>
        </div>
        <div>
          <p className='text-sm font-medium text-slate-900'>Test Type</p>
          <p className='p-3 bg-blue-900 text-white rounded-lg mt-1 font-semibold'>
            {test.isDynamic ? "Dynamic" : "Static"} Test Cannot be changed to{" "}
            {test.isDynamic ? "Static" : "Dynamic"} Test
          </p>
        </div>
        <div className='flex justify-end gap-4 pt-4'>
          <button
            type='button'
            onClick={onClose}
            className='px-5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={isLoading}
            className='px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400'
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
