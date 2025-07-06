"use client";

import Modal from "@/components/ui/Modal";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Expand, XCircle } from "lucide-react"; // Import an icon for the remove button
import { useEffect, useState } from "react";
import toast from "react-hot-toast";


/**
 * Converts a string of text into a multi-line, responsive SVG image.
 * Uses a <foreignObject> to embed HTML for automatic word wrapping.
 * @param {string} text The text to convert.
 * @returns {string} The SVG code as a string.
 */
const textToSvg = (text) => {
  // Sanitize text to be safely embedded in HTML
  const sanitizedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const svgWidth = 800; // The base width of the SVG canvas
  const svgHeight = 250; // Increased height to allow for several lines of text

  // CSS for the wrapping div inside the SVG
  const style = `
    box-sizing: border-box;
    font-family: Arial, sans-serif;
    font-size: 28px;
    color: #1e293b;
    line-height: 1.4;
    white-space: normal;
    word-wrap: break-word;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  `;

  // The SVG structure with a foreignObject containing a div
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
      <foreignObject x="15" y="15" width="${svgWidth - 30}" height="${
    svgHeight - 30
  }">
        <div xmlns="http://www.w3.org/1999/xhtml" style="${style
          .replace(/\s\s+/g, " ")
          .trim()}">
          <div>${sanitizedText}</div>
        </div>
      </foreignObject>
    </svg>
  `;
};

export default function EditQuestionForm({ question, onFormSubmit }) {
  const [questionText, setQuestionText] = useState("");
  const [questionSvgCode, setQuestionSvgCode] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewingSvg, setPreviewingSvg] = useState("");
  const [explanation, setExplanation] = useState("");

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
      setExplanation(question.explanation || "");
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

  // New handler to remove the SVG
  const handleRemoveSvg = () => {
    setQuestionSvgCode("");
    // This clears the file input so the same file can be re-uploaded
    const fileInput = document.querySelector(
      "input[type='file'][accept='image/svg+xml']"
    );
    if (fileInput) {
      fileInput.value = "";
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
        explanation: explanation,
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
          <SvgDisplayer
            svgCode={previewingSvg}
            className='w-full h-96 bg-slate-100 rounded-lg flex items-center justify-center'
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
            className='w-full p-3 border text-slate-900 border-slate-300 rounded-lg disabled:bg-slate-100'
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
            className='w-full text-sm text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
          />
        </div>

        {(questionSvgCode || questionText) && (
          <div>
            <div className='flex justify-between items-center mb-1'>
              <label className='text-sm font-medium text-slate-900'>
                Preview
              </label>
              <div className='flex items-center gap-4'>
                {questionSvgCode && (
                  <button
                    type='button'
                    onClick={handleRemoveSvg}
                    className='flex items-center text-sm font-medium text-red-600 hover:text-red-800'
                  >
                    <XCircle className='h-4 w-4 mr-1' />
                    Remove SVG
                  </button>
                )}
                <button
                  type='button'
                  onClick={openPreview}
                  className='flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800'
                >
                  <Expand className='h-4 w-4 mr-1' /> View Fullscreen
                </button>
              </div>
            </div>
            <SvgDisplayer
              svgCode={questionSvgCode || textToSvg(questionText)}
              className='h-auto min-h-[10rem] border border-slate-300 rounded-lg bg-slate-50 flex items-center'
            />
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
              className='w-full p-3 border text-slate-900 border-slate-300 rounded-lg mb-2'
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
            className='w-full p-3 border text-slate-900 border-slate-300 rounded-lg'
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
        <div>
          <label
            htmlFor='edit-explanation'
            className='block text-sm font-medium text-slate-900 mb-1'
          >
            Explanation (Optional)
          </label>
          <textarea
            id='edit-explanation'
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder='Explain why the correct answer is right...'
            className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
            rows={3}
          />
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
