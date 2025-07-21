"use client";

import Modal from "../ui/Modal";
import { Lightbulb, Map, Trophy, Lock } from "lucide-react";

const InfoStep = ({ icon, title, text }) => (
  <div className='flex items-start gap-4'>
    <div className='flex-shrink-0 bg-indigo-100 text-indigo-600 p-2 rounded-full'>
      {icon}
    </div>
    <div>
      <h4 className='font-bold text-slate-800'>{title}</h4>
      <p className='text-slate-600 text-sm'>{text}</p>
    </div>
  </div>
);

export default function AdventureHelpModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="What's an Exam Adventure?">
      <div className='p-6 space-y-6'>
        <InfoStep
          icon={<Map size={20} />}
          title='A Learning Journey'
          text="Think of it as a treasure map! Each adventure is a path of small quizzes (we call them 'stages') that guides a student through a subject, step-by-step."
        />
        <InfoStep
          icon={<Lock size={20} />}
          title='Unlock As You Go'
          text="Students must pass one stage to unlock the next one. It's a fun way to make sure they master a topic before moving on."
        />
        <InfoStep
          icon={<Trophy size={20} />}
          title='The Final Challenge!'
          text="The last stage is the 'Boss Level'—a final big test to prove they've mastered the entire adventure."
        />
        <div className='mt-6 text-center'>
          <button
            onClick={onClose}
            className='px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700'
          >
            Got It, Let's Build!
          </button>
        </div>
      </div>
    </Modal>
  );
}
