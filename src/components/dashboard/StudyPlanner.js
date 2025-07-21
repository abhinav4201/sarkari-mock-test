"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
  CalendarCheck,
  CheckCircle2,
  Plus,
  Edit,
  Trash2,
  Wand2,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";

// Helper to get the current week ID in the format YYYY-W##
const getWeekId = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
};

// Form for adding/editing a task, rendered inside the modal
const TaskForm = ({ task, onSave, onCancel }) => {
  const [text, setText] = useState(task ? task.text : "");
  const [day, setDay] = useState(task ? task.day : "Monday");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Task description cannot be empty.");
      return;
    }
    onSave({
      ...task, // Preserve existing properties like 'completed' and 'isUserAdded'
      text: text.trim(),
      day,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <label className='block text-sm font-medium text-slate-700'>
          Task / Topic / Subject
        </label>
        <input
          type='text'
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g., Complete a test on Indian History'
          className='mt-1 w-full p-2 border border-slate-300 rounded-md text-slate-900'
          required
        />
      </div>
      <div>
        <label className='block text-sm font-medium text-slate-700'>Day</label>
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className='mt-1 w-full p-2 border border-slate-300 rounded-md text-slate-900'
        >
          {[
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className='flex justify-end gap-2 pt-2'>
        <button
          type='button'
          onClick={onCancel}
          className='px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg'
        >
          Cancel
        </button>
        <button
          type='submit'
          className='px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg'
        >
          {task ? "Save Changes" : "Add Task"}
        </button>
      </div>
    </form>
  );
};

export default function StudyPlanner() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const fetchPlan = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const weekId = getWeekId();
    const planRef = doc(db, `users/${user.uid}/studyPlan`, weekId);
    const planSnap = await getDoc(planRef);

    if (planSnap.exists()) {
      setPlan(planSnap.data());
    } else {
      setPlan({ tasks: [], weekId });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlan();
  }, [user]);

  const handleSaveTask = async (taskData) => {
    const weekId = getWeekId();
    const planRef = doc(db, `users/${user.uid}/studyPlan`, weekId);

    try {
      let updatedTasks;
      if (taskToEdit !== null) {
        updatedTasks = plan.tasks.map((t, index) =>
          index === taskToEdit.index ? taskData : t
        );
      } else {
        updatedTasks = [
          ...(plan?.tasks || []),
          { ...taskData, completed: false, isUserAdded: true },
        ];
      }

      await setDoc(planRef, { tasks: updatedTasks, weekId }, { merge: true });
      toast.success(taskToEdit ? "Task updated!" : "Task added!");
      setPlan({ tasks: updatedTasks, weekId });
    } catch (error) {
      toast.error("Could not save the task.");
    } finally {
      setIsModalOpen(false);
      setTaskToEdit(null);
    }
  };

  const handleToggleTask = async (taskIndex) => {
    const newTasks = [...plan.tasks];
    newTasks[taskIndex].completed = !newTasks[taskIndex].completed;
    setPlan((prev) => ({ ...prev, tasks: newTasks }));

    try {
      const weekId = getWeekId();
      const planRef = doc(db, `users/${user.uid}/studyPlan`, weekId);
      await updateDoc(planRef, { tasks: newTasks });
    } catch (error) {
      toast.error("Could not update task status.");
      newTasks[taskIndex].completed = !newTasks[taskIndex].completed;
      setPlan((prev) => ({ ...prev, tasks: newTasks }));
    }
  };

  const handleDeleteTask = async (taskIndex) => {
    const newTasks = plan.tasks.filter((_, index) => index !== taskIndex);
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        const weekId = getWeekId();
        const planRef = doc(db, `users/${user.uid}/studyPlan`, weekId);
        await updateDoc(planRef, { tasks: newTasks });
        toast.success("Task removed.");
        setPlan((prev) => ({ ...prev, tasks: newTasks }));
      } catch (error) {
        toast.error("Failed to remove task.");
      }
    }
  };

  const { recommendedTasks, userTasks } = useMemo(() => {
    if (!plan?.tasks) return { recommendedTasks: [], userTasks: [] };
    return {
      recommendedTasks: plan.tasks.filter((task) => !task.isUserAdded),
      userTasks: plan.tasks.filter((task) => task.isUserAdded),
    };
  }, [plan]);

  if (loading) {
    return (
      <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-pulse'>
        <div className='h-8 bg-slate-200 rounded w-3/4 mb-4'></div>
        <div className='space-y-3'>
          <div className='h-6 bg-slate-200 rounded'></div>
          <div className='h-6 bg-slate-200 rounded'></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }}
        title={taskToEdit ? "Edit Task" : "Add a New Task"}
      >
        <TaskForm
          task={taskToEdit?.task}
          onSave={handleSaveTask}
          onCancel={() => {
            setIsModalOpen(false);
            setTaskToEdit(null);
          }}
        />
      </Modal>

      <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3'>
            <CalendarCheck className='text-purple-500' />
            Your Weekly Plan
          </h2>
          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsModalOpen(true);
            }}
            className='flex items-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-700 font-semibold text-sm rounded-lg hover:bg-indigo-200'
          >
            <Plus size={16} /> Add Task
          </button>
        </div>

        {/* Recommended Tasks Section */}
        {recommendedTasks.length > 0 && (
          <div className='mb-6'>
            <h3 className='font-bold text-slate-800 flex items-center gap-2 mb-2'>
              <Wand2 size={18} className='text-purple-500' />
              Recommended For You
            </h3>
            <div className='space-y-3'>
              {recommendedTasks.map((task, index) => (
                <div
                  key={index}
                  className='flex items-center gap-3 p-3 bg-slate-50 rounded-lg'
                >
                  <button
                    onClick={() =>
                      handleToggleTask(plan.tasks.findIndex((t) => t === task))
                    }
                  >
                    <CheckCircle2
                      className={`h-6 w-6 transition-colors ${
                        task.completed
                          ? "text-green-500 fill-green-100"
                          : "text-slate-300 hover:text-slate-400"
                      }`}
                    />
                  </button>
                  <div>
                    <p
                      className={`font-semibold ${
                        task.completed
                          ? "text-slate-400 line-through"
                          : "text-slate-800"
                      }`}
                    >
                      {task.day}
                    </p>
                    <p
                      className={`text-sm ${
                        task.completed
                          ? "text-slate-400 line-through"
                          : "text-slate-600"
                      }`}
                    >
                      {task.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Tasks Section */}
        <div className='mb-2'>
          <h3 className='font-bold text-slate-800 mb-2'>Your Personal Tasks</h3>
          <div className='space-y-3'>
            {userTasks.length > 0 ? (
              userTasks.map((task, index) => {
                const originalIndex = plan.tasks.findIndex((t) => t === task);
                return (
                  <div
                    key={index}
                    className='flex items-center gap-3 p-3 bg-slate-50 rounded-lg group'
                  >
                    <button onClick={() => handleToggleTask(originalIndex)}>
                      <CheckCircle2
                        className={`h-6 w-6 transition-colors ${
                          task.completed
                            ? "text-green-500 fill-green-100"
                            : "text-slate-300 hover:text-slate-400"
                        }`}
                      />
                    </button>
                    <div className='flex-grow'>
                      <p
                        className={`font-semibold ${
                          task.completed
                            ? "text-slate-400 line-through"
                            : "text-slate-800"
                        }`}
                      >
                        {task.day}
                      </p>
                      <p
                        className={`text-sm ${
                          task.completed
                            ? "text-slate-400 line-through"
                            : "text-slate-600"
                        }`}
                      >
                        {task.text}
                      </p>
                    </div>
                    <div className='flex items-center opacity-0 group-hover:opacity-100 transition-opacity'>
                      <button
                        onClick={() => {
                          setTaskToEdit({ task, index: originalIndex });
                          setIsModalOpen(true);
                        }}
                        className='p-2 text-slate-500 hover:text-blue-600 rounded-full'
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(originalIndex)}
                        className='p-2 text-slate-500 hover:text-red-600 rounded-full'
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className='text-center text-slate-500 text-sm py-4'>
                You haven't added any personal tasks for this week.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
