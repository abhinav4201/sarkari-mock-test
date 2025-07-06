"use client";

import { memo } from "react";

const PaletteButton = ({ index, status, onQuestionSelect }) => {
  let statusClasses = "";
  switch (status) {
    case "answered":
      statusClasses = "bg-green-600 text-white border-green-700";
      break;
    case "review":
      statusClasses = "bg-purple-600 text-white border-purple-700";
      break;
    case "current":
      statusClasses =
        "bg-blue-600 text-white border-blue-700 scale-110 shadow-lg";
      break;
    default: // Not answered
      statusClasses =
        "bg-white text-slate-800 border-slate-400 hover:bg-slate-100";
  }

  return (
    <button
      onClick={() => onQuestionSelect(index)}
      className={`h-10 w-10 flex items-center justify-center rounded-lg font-bold border-2 transition-all duration-200 ${statusClasses}`}
    >
      {index + 1}
    </button>
  );
};

const QuestionPalette = ({
  questions,
  currentQuestionIndex,
  selectedOptions,
  markedForReview,
  onQuestionSelect,
}) => {
  return (
    <div className='p-4 border border-slate-300 rounded-2xl bg-slate-50'>
      <h3 className='font-bold text-lg mb-4 text-slate-800'>
        Question Palette
      </h3>
      <div className='grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2'>
        {questions.map((question, index) => {
          let status = "not-answered";
          if (currentQuestionIndex === index) {
            status = "current";
          } else if (markedForReview.has(question.id)) {
            status = "review";
          } else if (selectedOptions[question.id]) {
            status = "answered";
          }
          return (
            <PaletteButton
              key={question.id}
              index={index}
              status={status}
              onQuestionSelect={onQuestionSelect}
            />
          );
        })}
      </div>
      <div className='mt-4 space-y-2 text-xs text-slate-600'>
        <div className='flex items-center gap-2'>
          <div className='w-4 h-4 rounded bg-green-600 border border-green-700'></div>{" "}
          Answered
        </div>
        <div className='flex items-center gap-2'>
          <div className='w-4 h-4 rounded bg-purple-600 border border-purple-700'></div>{" "}
          Marked for Review
        </div>
        <div className='flex items-center gap-2'>
          <div className='w-4 h-4 rounded bg-white border border-slate-400'></div>{" "}
          Not Answered
        </div>
      </div>
    </div>
  );
};

// Use memo to prevent re-rendering when parent state changes unnecessarily
export default memo(QuestionPalette);
