"use client";

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import toast from "react-hot-toast";
import { PlusCircle, Info } from "lucide-react";
import ConfirmationModal from "../ui/ConfirmationModal";
import { useRouter } from "next/navigation";

const TEST_CREATION_FEE = 10;

export default function UserTestCreator() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [examName, setExamName] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [estimatedTime, setEstimatedTime] = useState(15);
  const [isHidden, setIsHidden] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canAfford = userProfile && userProfile.bonusCoins >= TEST_CREATION_FEE;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canAfford) {
      toast.error("You don't have enough bonus coins to create a test.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsModalOpen(false);
    setIsSubmitting(true);
    const loadingToast = toast.loading("Submitting your test for approval...");

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
          examName,
          topic,
          subject,
          estimatedTime: Number(estimatedTime),
          isHidden,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Test submitted! Redirecting to add questions...", {
        id: loadingToast,
      });

      // Reset form
      setTitle("");
      setExamName("");
      setTopic("");
      setSubject("");
      setEstimatedTime(15);
      setIsHidden(false);

      // Redirect to the question uploader page for the new test
      router.push(`/admin/mock-tests/${data.testId}`);
    } catch (error) {
      toast.error(`Submission failed: ${error.message}`, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userProfile?.canCreateTests) return null;

  return (
    <>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        title='Confirm Test Creation'
        message={`This will deduct ${TEST_CREATION_FEE} bonus coins from your account. Are you sure you want to proceed?`}
      />
      <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
        <div className='flex items-center gap-3'>
          <div className='bg-indigo-100 p-3 rounded-full'>
            <PlusCircle className='h-6 w-6 text-indigo-600' />
          </div>
          <div>
            <h2 className='text-2xl font-bold text-slate-900'>
              Create a New Mock Test
            </h2>
            <p className='text-slate-600'>
              Contribute to the community and get it approved by our team.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-slate-700'>
              Test Title
            </label>
            <input
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
              required
            />
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-slate-700'>
                Exam Name (e.g., SSC CGL)
              </label>
              <input
                type='text'
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-slate-700'>
                Subject
              </label>
              <input
                type='text'
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
                required
              />
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium text-slate-700'>
              Topic
            </label>
            <input
              type='text'
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-slate-700'>
              Estimated Time (minutes)
            </label>
            <input
              type='number'
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className='mt-1 w-full p-2 border text-slate-900 border-slate-300 rounded-md'
              required
            />
          </div>

          <div className='pt-2'>
            <div className='relative flex items-start'>
              <div className='flex h-6 items-center'>
                <input
                  id='isHidden'
                  name='isHidden'
                  type='checkbox'
                  checked={isHidden}
                  onChange={(e) => setIsHidden(e.target.checked)}
                  className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600'
                />
              </div>
              <div className='ml-3 text-sm leading-6'>
                <label
                  htmlFor='isHidden'
                  className='font-medium text-slate-900'
                >
                  Hide from public Test Hub?
                </label>
                <p className='text-slate-500 text-xs flex items-start gap-1 mt-1'>
                  <Info size={14} className='flex-shrink-0 mt-0.5' />
                  <span>
                    Enable this if creating a test for a specific Exam
                    Adventure. Hidden tests won't appear in the main test list.
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className='pt-2'>
            <button
              type='submit'
              disabled={isSubmitting || !canAfford}
              className='w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400'
            >
              {isSubmitting
                ? "Submitting..."
                : `Submit for Approval (${TEST_CREATION_FEE} Coins)`}
            </button>
            {!canAfford && (
              <p className='text-center text-sm text-red-600 mt-2'>
                Not enough bonus coins.
              </p>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
