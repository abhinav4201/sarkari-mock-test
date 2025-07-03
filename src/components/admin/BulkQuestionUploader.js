"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// A simple, dependency-free CSV parser function
const parseCSV = (csvText) => {
  const lines = csvText.trim().split("\n");
  const header = lines[0].split(",").map((h) => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const row = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = values[j] ? values[j].trim().replace(/^"|"$/g, "") : "";
    }
    data.push(row);
  }
  return data;
};

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

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const csvText = evt.target.result;
        const parsedData = parseCSV(csvText);

        const questions = parsedData.map((row) => {
          if (
            !row.questionSvgCode ||
            !row.option1 ||
            !row.option2 ||
            !row.option3 ||
            !row.option4 ||
            !row.correctAnswer
          ) {
            throw new Error(
              "CSV is missing required columns in one or more rows."
            );
          }
          return {
            questionSvgCode: row.questionSvgCode,
            options: [row.option1, row.option2, row.option3, row.option4],
            correctAnswer: row.correctAnswer,
          };
        });

        const res = await fetch("/api/admin/questions/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testId, questions }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Bulk upload failed");
        }

        const responseData = await res.json();
        toast.success(
          `Successfully uploaded ${responseData.uploadedCount} questions!`,
          { id: loadingToast }
        );
        router.refresh();
      } catch (error) {
        toast.error(`Error: ${error.message}`, { id: loadingToast });
      } finally {
        setIsUploading(false);
        setCsvFile(null);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read the selected file.", { id: loadingToast });
      setIsUploading(false);
    };

    reader.readAsText(csvFile);
  };

  const downloadTemplate = () => {
    const template =
      'questionSvgCode,option1,option2,option3,option4,correctAnswer\n"<svg>...</svg>","Option A","Option B","Option C","Option D","Option A"';
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "question_template.csv");
    link.style.visibility = "hidden";
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
