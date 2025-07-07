"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { Calendar, ChevronDown, ChevronRight } from "lucide-react";

export default function ArchiveSidebar({ onMonthSelect }) {
  const [archives, setArchives] = useState({});
  const [loading, setLoading] = useState(true);
  const [openYears, setOpenYears] = useState({});

  useEffect(() => {
    const fetchArchiveDates = async () => {
      try {
        // Efficiently fetch only the 'createdAt' field of all posts
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const dates = snapshot.docs.map((doc) => doc.data().createdAt.toDate());

        const groupedByYear = dates.reduce((acc, date) => {
          const year = date.getFullYear();
          const month = date.toLocaleString("default", { month: "long" });

          if (!acc[year]) {
            acc[year] = {};
          }
          if (!acc[year][month]) {
            acc[year][month] = { monthName: month, year: year };
          }
          return acc;
        }, {});

        setArchives(groupedByYear);
        // Automatically open the most recent year
        const mostRecentYear = Object.keys(groupedByYear)[0];
        if (mostRecentYear) {
          setOpenYears({ [mostRecentYear]: true });
        }
      } catch (error) {
        console.error("Failed to fetch archive dates:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArchiveDates();
  }, []);

  const toggleYear = (year) => {
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  if (loading) {
    return (
      <div className='p-6 bg-white rounded-2xl shadow-lg border animate-pulse'>
        <div className='h-6 bg-slate-200 rounded w-3/4 mb-4'></div>
        <div className='space-y-3'>
          <div className='h-5 bg-slate-200 rounded'></div>
          <div className='h-5 bg-slate-200 rounded'></div>
          <div className='h-5 bg-slate-200 rounded'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 bg-white rounded-2xl shadow-lg border border-slate-200'>
      <h3 className='flex items-center text-xl font-bold text-slate-900 mb-4'>
        <Calendar className='mr-3 text-indigo-500' />
        Post Archives
      </h3>
      <div className='space-y-2'>
        {Object.keys(archives).map((year) => (
          <div key={year}>
            <button
              onClick={() => toggleYear(year)}
              className='w-full flex justify-between items-center p-2 rounded-lg font-semibold text-slate-800 hover:bg-slate-100'
            >
              {year}
              {openYears[year] ? <ChevronDown /> : <ChevronRight />}
            </button>
            {openYears[year] && (
              <div className='pl-4 mt-1 space-y-1'>
                {Object.values(archives[year]).map(({ monthName }) => (
                  <button
                    key={monthName}
                    onClick={() => onMonthSelect({ year, monthName })}
                    className='block w-full text-left p-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                  >
                    {monthName}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
