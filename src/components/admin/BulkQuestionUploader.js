"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import Papa from "papaparse"; // Import the Papaparse library

export default function BulkQuestionUploader({ testId }) {
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!csvFile) {
      toast.error("Please select a CSV file first.");
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading(
      "Parsing CSV and uploading questions..."
    );

    // Use Papaparse to correctly read the CSV file
    Papa.parse(csvFile, {
      header: true, // Treat the first row as headers
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Check for parsing errors
          if (results.errors.length > 0) {
            console.error("CSV Parsing Errors:", results.errors);
            throw new Error(
              "Failed to parse CSV file. Please check the format."
            );
          }

          const questions = results.data.map((row) => {
            // Validate each row to ensure all required columns are present
            if (
              !row.questionSvgCode ||
              !row.option1 ||
              !row.option2 ||
              !row.option3 ||
              !row.option4 ||
              !row.correctAnswer
            ) {
              throw new Error(
                "CSV is missing required columns in one or more rows. Please check your file against the template."
              );
            }
            return {
              questionSvgCode: row.questionSvgCode,
              options: [row.option1, row.option2, row.option3, row.option4],
              correctAnswer: row.correctAnswer,
            };
          });

          // Perform the database transaction directly on the client
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
          router.refresh();
          
        } catch (error) {
          toast.error(`Error: ${error.message}`, { id: loadingToast });
        } finally {
          setIsUploading(false);
          setCsvFile(null);
          // Reset file input
          const fileInput = document.getElementById("csv-upload");
          if (fileInput) fileInput.value = "";
        }
      },
      error: (error) => {
        toast.error(`CSV Parsing Error: ${error.message}`, {
          id: loadingToast,
        });
        setIsUploading(false);
      },
    });
  };

  const downloadTemplate = () => {
    const template =
      'questionSvgCode,option1,option2,option3,option4,correctAnswer\n"<svg>Your SVG code here...</svg>","Option A","Option B","Option C","Option D","Option A"';
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "question_template.csv");
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
