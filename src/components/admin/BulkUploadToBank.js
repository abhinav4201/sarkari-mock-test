// components/admin/BulkUploadToBank.js
"use client";

import { db } from "@/lib/firebase";
import {
  collection,
  writeBatch,
  serverTimestamp,
  doc,
} from "firebase/firestore";
import Papa from "papaparse";
import { useState } from "react";
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

export default function BulkUploadToBank({ onUploadSuccess }) {
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => setCsvFile(e.target.files[0]);

  const handleUpload = () => {
    if (!csvFile) return toast.error("Please select a CSV file first.");
    setIsUploading(true);
    const loadingToast = toast.loading("Uploading questions to bank...");

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const questions = results.data.map((row) => {
            if (
              !row.questionText ||
              !row.option1 ||
              !row.option4 ||
              !row.correctAnswer ||
              !row.topic ||
              !row.subject
            ) {
              throw new Error(
                "CSV is missing required data in one or more rows. Please use the template."
              );
            }

            // NEW: Parse isPremium from the CSV row
            const isPremiumQuestion = row.isPremium?.toUpperCase() === "TRUE";

            return {
              questionSvgCode: textToSvg(row.questionText),
              options: [row.option1, row.option2, row.option3, row.option4],
              correctAnswer: row.correctAnswer,
              explanation: row.explanation || "",
              topic: row.topic,
              subject: row.subject,
              isPremium: isPremiumQuestion, // NEW: Include isPremium
            };
          });

          const batch = writeBatch(db);
          const questionsCollection = collection(db, "questionBank");
          questions.forEach((q) => {
            batch.set(doc(questionsCollection), {
              ...q,
              createdAt: serverTimestamp(),
            });
          });
          await batch.commit();

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
          const fileInput = document.getElementById("csv-bank-upload");
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
    // UPDATED: Template now includes 'isPremium' column
    const template =
      'questionText,option1,option2,option3,option4,correctAnswer,explanation,topic,subject,isPremium\n"What is the capital of France?","Paris","London","Berlin","Rome","Paris","Paris is the capital.","Geography","World Capitals","FALSE"\n"Which river flows through Rome?","Tiber","Nile","Thames","Seine","Tiber","The Tiber is the third-longest river in Italy.","Geography","European Rivers","TRUE"';
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "question_bank_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='space-y-4'>
      <div>
        <label
          htmlFor='csv-bank-upload'
          className='block text-sm font-medium text-slate-800 mb-1'
        >
          Upload CSV File
        </label>
        <input
          id='csv-bank-upload'
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
