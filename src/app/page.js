import BlogPostCard from "@/components/blog/BlogPostCard";
import FeatureCard from "@/components/home/FeatureCard";
import HeroSection from "@/components/home/HeroSection";
import CTASection from "@/components/home/CTASection"; // Import the new CTA component
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import {
  ArrowRight,
  PenSquare,
  Target,
  Timer,
  ShieldCheck,
  BrainCircuit,
  Shuffle,
} from "lucide-react";
import Link from "next/link";

async function getRecentPosts() {
  const postsCollection = collection(db, "posts");
  const q = query(postsCollection, orderBy("createdAt", "desc"), limit(3));
  const postsSnapshot = await getDocs(q);
  return postsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toMillis(),
    };
  });
}

const features = [
  {
    icon: <Timer size={28} />,
    title: "Realistic Timed Tests",
    text: "Experience real exam conditions with our timed mock tests to improve your speed and accuracy.",
    color: "text-purple-600",
  },
  {
    icon: <Target size={28} />,
    title: "Daily GK & Vocabulary",
    text: "Stay updated with curated daily general knowledge and essential vocabulary to ace your exams.",
    color: "text-sky-600",
  },
  {
    icon: <PenSquare size={28} />,
    title: "Expert Analysis & Notes",
    text: "Get detailed performance analysis after every test and access our library of expert-written notes.",
    color: "text-amber-600",
  },
  {
    icon: <ShieldCheck size={28} />,
    title: "AI-Powered Proctoring",
    text: "Ensure exam integrity with our advanced AI proctoring for a fair and secure testing environment.",
    color: "text-green-600",
  },
  {
    icon: <BrainCircuit size={28} />,
    title: "AI Recommendations",
    text: "Receive personalized test suggestions and study plans based on your performance analysis.",
    color: "text-rose-600",
  },
  {
    icon: <Shuffle size={28} />,
    title: "Dynamic Question Sets",
    text: "Never take the same test twice. Our randomized tests pull from a vast question bank for endless practice.",
    color: "text-indigo-600",
  },
];

export default async function HomePage() {
  const recentPosts = await getRecentPosts();

  return (
    <div className='bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white'>
      <HeroSection />

      <section className='py-20 bg-slate-50 dark:bg-slate-900'>
        <div className='container mx-auto px-6'>
          <div className='text-center'>
            <h2 className='text-3xl font-bold'>
              Your Path to Success Starts Here
            </h2>
            <p className='mt-2 text-lg text-slate-700 dark:text-slate-300'>
              Everything you need, all in one place.
            </p>
          </div>
          <div className='mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                text={feature.text}
                delay={index * 100}
                color={feature.color}
              />
            ))}
          </div>
        </div>
      </section>

      {recentPosts.length > 0 && (
        <section className='py-20 bg-white dark:bg-slate-800/50'>
          <div className='container mx-auto px-6'>
            <h2 className='text-3xl font-bold text-center'>
              Insights & Strategies
            </h2>
            <div className='mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {recentPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
            <div className='text-center mt-16'>
              <Link
                href='/blog'
                className='font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center'
              >
                View All Articles <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Use the new CTASection component here */}
      <CTASection />
    </div>
  );
}
