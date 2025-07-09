"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import EditBankQuestionForm from "./EditBankQuestionForm";

export default function QuestionBankList({
  questions,
  onDataChange,
  loadMore,
  hasMore,
  isLoadingMore,
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deletingQuestionId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "questionBank", deletingQuestionId));
      toast.success("Question deleted from bank!");
      onDataChange(); // This will trigger a full refresh
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsConfirmModalOpen(false);
      setDeletingQuestionId(null);
      setIsDeleting(false);
    }
  };

  const handleUpdateSuccess = () => {
    setIsEditModalOpen(false);
    setEditingQuestion(null);
    onDataChange();
  };

  const handleDeleteClick = (questionId) => {
    setDeletingQuestionId(questionId);
    setIsConfirmModalOpen(true);
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setIsEditModalOpen(true);
  };

  return (
    <>
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title='Edit Bank Question'
      >
        {editingQuestion && (
          <EditBankQuestionForm
            question={editingQuestion}
            onFormSubmit={handleUpdateSuccess}
          />
        )}
      </Modal>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title='Delete Question'
        message='Are you sure you want to permanently delete this question from the bank?'
        confirmText='Delete'
        isLoading={isDeleting}
      />

      <div className='space-y-6'>
        {questions && questions.length > 0 ? (
          questions.map((q, index) => (
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
              <div className='mt-2 text-xs font-semibold text-slate-500'>
                <span>Topic: {q.topic}</span> |{" "}
                <span>Subject: {q.subject}</span>
              </div>
              <SvgDisplayer
                svgCode={q.questionSvgCode}
                className='mt-2 h-auto min-h-[12rem] rounded-md border bg-slate-50 flex items-center'
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
            No questions in the bank yet. Add one to get started!
          </p>
        )}

        {hasMore && (
          <div className='text-center mt-6'>
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50'
            >
              {isLoadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
