"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import Papa from "papaparse";

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
      <foreignObject x="15" y="15" width="${svgWidth - 30}" height="${svgHeight - 30}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="${style.replace(/\s\s+/g, ' ').trim()}">
          <div>${sanitizedText}</div>
        </div>
      </foreignObject>
    </svg>
  `;
};

export default function BulkQuestionUploader({ testId, onUploadSuccess }) {
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => setCsvFile(e.target.files[0]);

  const handleUpload = () => {
    if (!csvFile) return toast.error("Please select a CSV file first.");
    setIsUploading(true);
    const loadingToast = toast.loading("Uploading questions...");

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const questions = results.data.map((row) => {
            if (
              (!row.questionText && !row.questionSvgCode) ||
              !row.option1 ||
              !row.option4 ||
              !row.correctAnswer
            ) {
              throw new Error(
                "CSV is missing required data in one or more rows. Please use the template."
              );
            }
            const finalSvgCode = row.questionText
              ? textToSvg(row.questionText)
              : row.questionSvgCode;
            return {
              questionSvgCode: finalSvgCode,
              options: [row.option1, row.option2, row.option3, row.option4],
              correctAnswer: row.correctAnswer,
            };
          });

          await runTransaction(db, async (transaction) => {
            const testRef = doc(db, "mockTests", testId);
            const testDoc = await transaction.get(testRef);
            if (!testDoc.exists())
              throw new Error("Parent test does not exist!");

            const questionsCollection = collection(db, "mockTestQuestions");
            questions.forEach((q) => {
              const newQuestionRef = doc(questionsCollection);
              transaction.set(newQuestionRef, {
                ...q,
                testId,
                createdAt: serverTimestamp(),
              });
            });

            const newCount =
              (testDoc.data().questionCount || 0) + questions.length;
            transaction.update(testRef, { questionCount: newCount });
          });

          toast.success(
            `Successfully uploaded ${questions.length} questions!`,
            { id: loadingToast }
          );
          if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
          toast.error(`Error: ${error.message}`, { id: loadingToast });
        } finally {
          setIsUploading(false);
          setCsvFile(null);
          const fileInput = document.getElementById("csv-upload");
          if (fileInput) fileInput.value = "";
        }
      },
      error: (error) =>
        toast.error(`CSV Parsing Error: ${error.message}`, {
          id: loadingToast,
        }),
    });
  };

  const downloadTemplate = () => {
    const template =
      'questionText,questionSvgCode,option1,option2,option3,option4,correctAnswer\n"Fill this column OR the SVG code column","","Option A","Option B","Option C","Option D","Option A"\n"","<svg>Fill this column OR the text column</svg>","Option 1","Option 2","Option 3","Option 4","Option 2"';
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "question_template_hybrid.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='space-y-4'>
      <div>
        <label
          htmlFor='csv-upload'
          className='block text-sm font-medium text-slate-800 mb-1'
        >
          Upload CSV File
        </label>
        <input
          id='csv-upload'
          type='file'
          accept='.csv'
          onChange={handleFileChange}
          className='w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
        />
      </div>
      <div className='flex flex-col sm:flex-row gap-4'>
        <button
          onClick={downloadTemplate}
          type='button'
          className='w-full px-4 py-2 text-sm bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300'
        >
          Download Template
        </button>
        <button
          onClick={handleUpload}
          disabled={isUploading || !csvFile}
          className='w-full px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400'
        >
          {isUploading ? "Uploading..." : "Upload Questions"}
        </button>
      </div>
    </div>
  );
}
