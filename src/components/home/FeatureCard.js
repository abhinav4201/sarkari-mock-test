"use client";

import React, { useEffect, useRef, useState } from "react";

const useInView = (options) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        // Check if ref.current is not null before calling unobserve
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return [ref, isInView];
};

export default function FeatureCard({ icon, title, text, delay, color }) {
  const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className='bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 h-full'>
        {/* --- THIS IS THE UPDATED ICON STYLE --- */}
        <div className='bg-white dark:bg-slate-900 h-16 w-16 flex items-center justify-center rounded-2xl shadow-md border dark:border-slate-700'>
          {React.cloneElement(icon, { className: `h-8 w-8 ${color}` })}
        </div>
        <h3 className='mt-5 text-xl font-bold text-slate-900 dark:text-white'>
          {title}
        </h3>
        <p className='mt-2 text-slate-700 dark:text-slate-300'>{text}</p>
      </div>
    </div>
  );
}
