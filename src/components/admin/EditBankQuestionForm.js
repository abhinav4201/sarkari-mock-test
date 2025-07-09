// components/admin/EditBankQuestionForm.js
"use client";

import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const textToSvg = (text) => {
  const sanitizedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svgWidth = 800;
  const svgHeight = 250;
  const style = `box-sizing: border-box; font-family: Arial, sans-serif; font-size: 28px; color: #1e293b; line-height: 1.4; white-space: normal; word-wrap: break-word; width: 100%; height: 100%; display: flex; align-items: center; justify-content: flex-start;`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}"><foreignObject x="15" y="15" width="${
    svgWidth - 30
  }" height="${
    svgHeight - 30
  }"><div xmlns="http://www.w3.org/1999/xhtml" style="${style
    .replace(/\s\s+/g, " ")
    .trim()}"><div>${sanitizedText}</div></div></foreignObject></svg>`;
};

export default function EditBankQuestionForm({ question, onFormSubmit }) {
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (question) {
      // Simple text extraction for editing. Assumes text-based SVG content.
      const textContent = question.questionSvgCode?.match(/<div>(.*?)<\/div>/);
      setQuestionText(
        textContent
          ? textContent[1]
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&amp;/g, "&")
          : ""
      );
      setOptions(question.options || ["", "", "", ""]);
      setCorrectAnswer(question.correctAnswer || "");
      setExplanation(question.explanation || "");
      setTopic(question.topic || "");
      setSubject(question.subject || "");
    }
  }, [question]);

  const handleOptionChange = (index, value) =>
    setOptions((prev) => {
      const newOpts = [...prev];
      newOpts[index] = value;
      return newOpts;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading("Updating question...");

    try {
      const questionRef = doc(db, "questionBank", question.id);
      const finalSvgCode = textToSvg(questionText);

      await updateDoc(questionRef, {
        questionSvgCode: finalSvgCode,
        options,
        correctAnswer,
        explanation,
        topic,
        subject,
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
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Question Text
        </label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder='Type your question here...'
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
        />
      </div>
      <div>
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Topic
        </label>
        <input
          type='text'
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder='e.g., Indian History'
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
        />
      </div>
      <div>
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Subject
        </label>
        <input
          type='text'
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder='e.g., General Studies'
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
          required
        />
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
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Correct Answer
        </label>
        <select
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
      <div>
        <label className='block text-sm font-medium text-slate-900 mb-1'>
          Explanation (Optional)
        </label>
        <textarea
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
  );
}
