"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal"; // Import the Modal
import EditQuestionForm from "./EditQuestionForm"; // Import the Form

export default function QuestionList({ initialQuestions, testId }) {
  // No longer need local 'questions' state, as router.refresh will handle updates.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const router = useRouter();

  const handleDelete = async (questionId) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    const loadingToast = toast.loading("Deleting question...");
    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete");
      }

      toast.success("Question deleted!", { id: loadingToast });
      router.refresh(); // Re-fetches server data and re-renders the page
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    }
  };

  // THIS IS THE FIX: This function now correctly sets the state
  // to open the modal with the selected question's data.
  const handleEdit = (question) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  // This function is passed to the form to be called on a successful update
  const handleUpdateSuccess = () => {
    handleCloseModal();
    router.refresh();
  };

  return (
    <>
      {/* The Modal component is here, but invisible until isModalOpen is true */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title='Edit Question'
      >
        {/* Ensure we only render the form when there's a question to edit */}
        {editingQuestion && (
          <EditQuestionForm
            question={editingQuestion}
            onFormSubmit={handleUpdateSuccess}
          />
        )}
      </Modal>

      <div className='space-y-6'>
        {initialQuestions.length > 0 ? (
          initialQuestions.map((q, index) => (
            <div
              key={q.id}
              className='p-4 border border-slate-200 rounded-lg bg-white'
            >
              <div className='flex justify-between items-start'>
                <p className='font-bold text-slate-900'>Question {index + 1}</p>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => handleEdit(q)}
                    className='text-sm font-medium text-blue-600 hover:text-blue-800'
                  >
                    Edit
                  </button>
                  <span className='text-slate-300'>|</span>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className='text-sm font-medium text-red-600 hover:text-red-800'
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div
                className='mt-2 border rounded-md p-2 bg-slate-50'
                dangerouslySetInnerHTML={{ __html: q.questionSvgCode }}
              />
              <ul className='text-sm space-y-1 mt-2'>
                {q.options.map((opt, i) => (
                  <li
                    key={i}
                    className={`flex items-center ${
                      opt === q.correctAnswer
                        ? "font-bold text-green-700"
                        : "text-slate-800"
                    }`}
                  >
                    {opt === q.correctAnswer && (
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                        className='w-5 h-5 mr-2 text-green-500'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.06 0l4.25-5.832z'
                          clipRule='evenodd'
                        />
                      </svg>
                    )}
                    {opt}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className='text-center text-slate-600 p-8'>
            No questions added for this test yet.
          </p>
        )}
      </div>
    </>
  );
}
