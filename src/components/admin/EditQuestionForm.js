"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import Modal from "@/components/ui/Modal";
import { Expand } from "lucide-react";

const textToSvg = (text) => {
  const sanitizedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const style = `font-family: Arial, sans-serif; font-size: 24px; fill: #1e293b;`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="100"><text x="10" y="40" style="${style}">${sanitizedText}</text></svg>`;
};

export default function EditQuestionForm({ question, onFormSubmit }) {
  const [questionText, setQuestionText] = useState("");
  const [questionSvgCode, setQuestionSvgCode] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewingSvg, setPreviewingSvg] = useState("");

  useEffect(() => {
    if (question) {
      const svgTextContent = question.questionSvgCode?.match(
        /<text.*>(.*?)<\/text>/
      );
      if (svgTextContent && svgTextContent[1]) {
        setQuestionText(svgTextContent[1]);
        setQuestionSvgCode("");
      } else {
        setQuestionText("");
        setQuestionSvgCode(question.questionSvgCode || "");
      }
      setOptions(question.options || ["", "", "", ""]);
      setCorrectAnswer(question.correctAnswer || "");
    }
  }, [question]);

  const handleOptionChange = (index, value) =>
    setOptions((prev) => {
      const newOpts = [...prev];
      newOpts[index] = value;
      return newOpts;
    });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setQuestionSvgCode(evt.target.result);
        setQuestionText("");
      };
      reader.readAsText(file);
    }
  };

  const handleTextChange = (e) => {
    setQuestionText(e.target.value);
    if (e.target.value && questionSvgCode) {
      setQuestionSvgCode("");
    }
  };

  const openPreview = () => {
    const svgToShow = questionText ? textToSvg(questionText) : questionSvgCode;
    setPreviewingSvg(svgToShow);
    setIsPreviewModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading("Updating question...");

    try {
      const questionRef = doc(db, "mockTestQuestions", question.id);
      const finalSvgCode = questionText
        ? textToSvg(questionText)
        : questionSvgCode;

      await updateDoc(questionRef, {
        questionSvgCode: finalSvgCode,
        options,
        correctAnswer,
      });

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
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title='SVG Fullscreen Preview'
      >
        <div className='p-4 bg-slate-100 rounded-lg'>
          <div
            className='w-full h-full'
            dangerouslySetInnerHTML={{ __html: previewingSvg }}
          />
        </div>
      </Modal>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div>
          <label className='block text-sm font-medium text-slate-900 mb-1'>
            Question Text
          </label>
          <textarea
            value={questionText}
            onChange={handleTextChange}
            disabled={!!questionSvgCode}
            placeholder='Type question text here...'
            className='w-full p-3 border border-slate-300 rounded-lg disabled:bg-slate-100'
          />
        </div>
        <div className='text-center text-sm font-semibold text-slate-500'>
          OR
        </div>
        <div>
          <label className='block text-sm font-medium text-slate-900 mb-1'>
            Upload New SVG
          </label>
          <input
            type='file'
            accept='image/svg+xml'
            onChange={handleFileChange}
            disabled={!!questionText}
            className='w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
          />
        </div>

        {(questionSvgCode || questionText) && (
          <div>
            <div className='flex justify-between items-center mb-1'>
              <label className='text-sm font-medium text-slate-900'>
                Preview
              </label>
              <button
                type='button'
                onClick={openPreview}
                className='flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800'
              >
                <Expand className='h-4 w-4 mr-1' /> View Fullscreen
              </button>
            </div>
            {/* THIS IS THE FIX: We wrap the SVG in a div that controls its size */}
            <div className='border border-slate-300 rounded-lg p-2 h-40 overflow-auto bg-slate-50 [&>div]:w-full [&>div]:h-full [&_svg]:w-full [&_svg]:h-full [&_svg]:object-contain'>
              <div
                dangerouslySetInnerHTML={{
                  __html: questionSvgCode || textToSvg(questionText),
                }}
              />
            </div>
          </div>
        )}

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
              className='w-full p-3 border border-slate-300 rounded-lg mb-2'
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
            className='w-full p-3 border border-slate-300 rounded-lg'
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
