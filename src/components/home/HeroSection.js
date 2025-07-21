"use client";

import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import Link from "next/link";
import SignUpButton from "./SignUpButton";

// Dynamically import Typewriter to ensure it only runs on the client
const Typewriter = dynamic(() => import("react-typewriter-effect"), {
  ssr: false,
});

const HeroSection = () => {
  const { theme } = useTheme();

  return (
    <section
      id='home'
      className='relative z-10 overflow-hidden bg-white dark:bg-slate-900 pt-32 pb-20 md:pt-40 md:pb-28'
    >
      {/* Background SVG Shapes */}
      <div className='absolute top-0 right-0 z-[-1] opacity-30 lg:opacity-100'>
        <svg
          width='450'
          height='556'
          viewBox='0 0 450 556'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <circle cx='277' cy='63' r='225' fill='url(#paint0_linear_hero)' />
          <circle
            cx='17.9997'
            cy='182'
            r='18'
            fill='url(#paint1_radial_hero)'
          />
          <defs>
            <linearGradient
              id='paint0_linear_hero'
              x1='-54.5'
              y1='-178'
              x2='222'
              y2='288'
              gradientUnits='userSpaceOnUse'
            >
              <stop stopColor='#4A6CF7' stopOpacity='0.5' />
              <stop offset='1' stopColor='#4A6CF7' stopOpacity='0' />
            </linearGradient>
            <radialGradient
              id='paint1_radial_hero'
              cx='0'
              cy='0'
              r='1'
              gradientUnits='userSpaceOnUse'
              gradientTransform='translate(17.9997 182) rotate(90) scale(18)'
            >
              <stop offset='0.14' stopColor='#4A6CF7' stopOpacity='0' />
              <stop offset='1' stopColor='#4A6CF7' stopOpacity='0.08' />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div className='absolute bottom-0 left-0 z-[-1] opacity-30 lg:opacity-100'>
        <svg
          width='364'
          height='201'
          viewBox='0 0 364 201'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M5.88928 72.3303C33.6599 66.4798 101.397 64.9086 150.178 105.427C211.155 156.076 229.59 162.093 264.333 166.607C299.076 171.12 337.718 183.657 362.889 212.24'
            stroke='url(#paint0_linear_hero_bottom)'
          />
          <defs>
            <linearGradient
              id='paint0_linear_hero_bottom'
              x1='184.389'
              y1='69.2405'
              x2='184.389'
              y2='212.24'
              gradientUnits='userSpaceOnUse'
            >
              <stop stopColor='#4A6CF7' stopOpacity='0' />
              <stop offset='1' stopColor='#4A6CF7' stopOpacity='0.5' />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className='container'>
        <div className='-mx-4 flex flex-wrap'>
          <div className='w-full px-4'>
            <div className='mx-auto max-w-[800px] text-center'>
              <h1 className='mb-5 text-4xl leading-tight font-extrabold text-slate-900 sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight dark:text-white h-40 md:h-32'>
                <Typewriter
                  multiText={[
                    "Master Your Competitive Exams",
                    "Realistic Timed Mock Tests",
                    "Daily GK & Vocabulary Updates",
                    "AI-Powered Performance Analysis",
                  ]}
                  multiTextLoop={true}
                  cursorColor={theme === "dark" ? "#fff" : "#1e293b"}
                  typeSpeed={60}
                  deleteSpeed={30}
                  delaySpeed={2000}
                />
              </h1>
              <p className='mb-12 text-base leading-relaxed text-white sm:text-lg md:text-xl'>
                The ultimate platform with high-quality mock tests, daily
                current affairs, and expert analysis to help you achieve your
                goals.
              </p>
              <div className='mt-10 flex flex-col sm:flex-row items-center justify-center gap-4'>
                <Link
                  href='/mock-tests'
                  className='inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105'
                >
                  Explore Tests
                </Link>
                <SignUpButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
