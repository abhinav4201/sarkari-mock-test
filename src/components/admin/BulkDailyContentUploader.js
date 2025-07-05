"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
// THIS IS THE FIX: 'doc' has been added to the import statement.
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import Papa from "papaparse";

const textToSvg = (text) => {
  if (!text) return "";
  const sanitizedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const style = `font-family: Arial, sans-serif; font-size: 24px; fill: #1e293b;`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="100"><text x="10" y="40" style="${style}">${sanitizedText}</text></svg>`;
};

export default function BulkDailyContentUploader({ onUploadSuccess }) {
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState("vocabulary");

  const templates = {
    vocabulary:
      'wordText,wordSvgCode,meaningText,meaningSvgCode\n"Type word OR provide SVG code","","Type meaning OR provide SVG code",""',
    gk: 'contentText,contentSvgCode,category\n"Type content OR provide SVG code","","e.g., History"',
  };

  const handleUpload = () => {
    if (!csvFile) return toast.error("Please select a CSV file first.");
    setIsUploading(true);
    const loadingToast = toast.loading(`Uploading ${uploadType} content...`);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const collectionName =
            uploadType === "vocabulary" ? "dailyVocabulary" : "dailyGk";
          const batch = writeBatch(db);
          const contentCollection = collection(db, collectionName);

          results.data.forEach((row, index) => {
            let dataToWrite;
            if (uploadType === "vocabulary") {
              const wordSvgCode = row.wordText
                ? textToSvg(row.wordText)
                : row.wordSvgCode;
              const meaningSvgCode = row.meaningText
                ? textToSvg(row.meaningText)
                : row.meaningSvgCode;
              if (!wordSvgCode || !meaningSvgCode)
                throw new Error(
                  `Row ${index + 2}: Word and Meaning are required.`
                );
              dataToWrite = {
                wordSvgCode,
                meaningSvgCode,
                createdAt: serverTimestamp(),
              };
            } else {
              // GK
              const contentSvgCode = row.contentText
                ? textToSvg(row.contentText)
                : row.contentSvgCode;
              const category = row.category;
              if (!contentSvgCode || !category)
                throw new Error(
                  `Row ${index + 2}: Content and Category are required.`
                );
              dataToWrite = {
                contentSvgCode,
                category,
                createdAt: serverTimestamp(),
              };
            }
            // The 'doc' function is used here to create a reference for a new document with an auto-generated ID
            const newDocRef = doc(contentCollection);
            batch.set(newDocRef, dataToWrite);
          });

          await batch.commit();

          toast.success(`Successfully uploaded ${results.data.length} items!`, {
            id: loadingToast,
          });
          if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
          toast.error(`Error: ${error.message}`, { id: loadingToast });
        } finally {
          setIsUploading(false);
          setCsvFile(null);
          const fileInput = document.getElementById("bulk-csv-upload");
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
    const template = templates[uploadType];
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${uploadType}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold mb-2 text-slate-900'>Bulk Upload</h2>
      <p className='text-sm text-slate-600 mb-4'>
        Upload multiple items at once using a CSV file.
      </p>

      <div>
        <label
          htmlFor='bulk-upload-type'
          className='block text-sm font-medium text-slate-800 mb-1'
        >
          Content Type
        </label>
        <select
          id='bulk-upload-type'
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value)}
          className='w-full p-3 border border-slate-300 rounded-lg text-slate-900'
        >
          <option value='vocabulary'>Vocabulary</option>
          <option value='gk'>General Knowledge</option>
        </select>
      </div>

      <div>
        <label
          htmlFor='bulk-csv-upload'
          className='block text-sm font-medium text-slate-800 mb-1'
        >
          Upload CSV File
        </label>
        <input
          id='bulk-csv-upload'
          type='file'
          accept='.csv'
          onChange={(e) => setCsvFile(e.target.files[0])}
          className='w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'
        />
      </div>

      <div className='flex flex-col sm:flex-row gap-4 pt-2'>
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
          {isUploading ? "Uploading..." : "Upload CSV"}
        </button>
      </div>
    </div>
  );
}
