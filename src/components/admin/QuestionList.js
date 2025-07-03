"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import EditQuestionForm from "./EditQuestionForm";
import ConfirmationModal from "@/components/ui/ConfirmationModal"; // <-- Import the confirmation modal

export default function QuestionList({ initialQuestions, testId }) {
  // State for the edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // State for the delete confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();

  // This function opens the confirmation modal instead of deleting directly
  const handleDeleteClick = (questionId) => {
    setDeletingQuestionId(questionId);
    setIsConfirmModalOpen(true);
  };

  // This function contains the actual deletion logic, called by the modal
  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/questions/${deletingQuestionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      });

      if (!res.ok) throw new Error("Failed to delete question");

      toast.success("Question deleted!");
      router.refresh(); // Re-fetches server data to update the list
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      // Close the modal and reset state regardless of outcome
      setIsConfirmModalOpen(false);
      setDeletingQuestionId(null);
      setIsDeleting(false);
    }
  };

  // --- Edit Handlers ---
  const handleEdit = (question) => {
    setEditingQuestion(question);
    setIsEditModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    setIsEditModalOpen(false);
    setEditingQuestion(null);
    router.refresh();
  };

  return (
    <>
      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title='Edit Question'
      >
        {editingQuestion && (
          <EditQuestionForm
            question={editingQuestion}
            onFormSubmit={handleUpdateSuccess}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title='Delete Question'
        message='Are you sure you want to permanently delete this question? This action cannot be undone.'
        confirmText='Delete'
        isLoading={isDeleting}
      />

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
                    onClick={() => handleDeleteClick(q.id)}
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
          <p className='text-center text-slate-700 p-8'>
            No questions added for this test yet.
          </p>
        )}
      </div>
    </>
  );
}
