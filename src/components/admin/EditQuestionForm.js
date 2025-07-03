"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal"; // Import the reusable Modal component
import { Expand } from "lucide-react"; // Import an icon for the fullscreen button

export default function EditQuestionForm({ question, onFormSubmit }) {
  // State for each form field
  const [questionSvgCode, setQuestionSvgCode] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false); // State for the preview modal

  // When the 'question' prop changes, pre-fill the form
  useEffect(() => {
    if (question) {
      setQuestionSvgCode(question.questionSvgCode || "");
      setOptions(question.options || ["", "", "", ""]);
      setCorrectAnswer(question.correctAnswer || "");
    }
  }, [question]);

  // Handler to update the options array state
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Reads the selected SVG file and updates the textarea content
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setQuestionSvgCode(evt.target.result);
        toast.success("New SVG file loaded.");
      };
      reader.onerror = () => {
        toast.error("Failed to read the file.");
      };
      reader.readAsText(file);
    }
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading("Updating question...");

    try {
      const res = await fetch(`/api/admin/questions/${question.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionSvgCode, options, correctAnswer }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update question");
      }

      toast.success("Question updated successfully!", { id: loadingToast });
      onFormSubmit();
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Fullscreen Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title='SVG Fullscreen Preview'
      >
        <div className='p-4 bg-slate-100 rounded-lg'>
          <div
            className='w-full h-full'
            dangerouslySetInnerHTML={{ __html: questionSvgCode }}
          />
        </div>
      </Modal>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div>
          <label
            htmlFor='edit-question-svg-file'
            className='block text-sm font-medium text-slate-900 mb-1'
          >
            Upload New SVG (Optional)
          </label>
          <input
            id='edit-question-svg-file'
            type='file'
            accept='image/svg+xml'
            onChange={handleFileChange}
            className='w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
          />
          <p className='text-xs text-slate-600 mt-1'>
            Select a new file to replace the SVG code below.
          </p>
        </div>

        {/* SVG Preview Section */}
        {questionSvgCode && (
          <div>
            <div className='flex justify-between items-center mb-1'>
              <label className='block text-sm font-medium text-slate-900'>
                SVG Preview
              </label>
              <button
                type='button'
                onClick={() => setIsPreviewModalOpen(true)}
                className='flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800'
              >
                <Expand className='h-4 w-4 mr-1' />
                View Fullscreen
              </button>
            </div>
            <div className='border border-slate-300 rounded-lg p-2 h-40 overflow-auto bg-slate-50'>
              <div dangerouslySetInnerHTML={{ __html: questionSvgCode }} />
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor='edit-question-svg'
            className='block text-sm font-medium text-slate-900 mb-1'
          >
            Question SVG Code
          </label>
          <textarea
            id='edit-question-svg'
            value={questionSvgCode}
            onChange={(e) => setQuestionSvgCode(e.target.value)}
            className='w-full p-3 border border-slate-300 rounded-lg font-mono text-sm h-32 text-slate-900'
            required
          ></textarea>
        </div>
        <div>
          <label className='block text-sm font-medium text-slate-900 mb-1'>
            Options
          </label>
          {options.map((opt, index) => (
            <input
              key={index}
              type='text'
              value={opt}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className='w-full p-3 border border-slate-300 rounded-lg mb-2 text-slate-900'
              required
            />
          ))}
        </div>
        <div>
          <label
            htmlFor='edit-correct-answer'
            className='block text-sm font-medium text-slate-900 mb-1'
          >
            Correct Answer
          </label>
          <select
            id='edit-correct-answer'
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
            required
          >
            <option value='' disabled>
              Select the correct option
            </option>
            {options.map(
              (opt, index) =>
                opt && (
                  <option key={index} value={opt}>
                    {opt}
                  </option>
                )
            )}
          </select>
        </div>
        <div className='flex justify-end pt-2'>
          <button
            type='submit'
            disabled={isLoading}
            className='px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400'
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </>
  );
}
