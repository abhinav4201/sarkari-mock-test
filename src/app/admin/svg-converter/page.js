"use client";
import { useState } from "react";
import SVGSingleConverter from "@/components/admin/SVGSingleConverter";;
import SVGBatchConverter from "@/components/admin/SVGBatchConverter";
import SVGGalleryViewer from "@/components/admin/SVGGalleryViewer";
import { Image, Images, GalleryHorizontal } from "lucide-react";

// The main application component with a tabbed interface
export default function SVGConverterApp() {
  const [activeTab, setActiveTab] = useState("single");

  const renderContent = () => {
    switch (activeTab) {
      case "single":
        return <SVGSingleConverter />;
      case "batch":
        return <SVGBatchConverter />;
      case "gallery":
        return <SVGGalleryViewer />;
      default:
        return <SVGSingleConverter />;
    }
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-all ${
        activeTab === id
          ? "bg-blue-600 text-white shadow-md"
          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
      }`}
    >
      <Icon className='h-5 w-5' />
      <span>{label}</span>
    </button>
  );

  return (
    <div className='p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        <header className='mb-6'>
          <h1 className='text-3xl font-bold text-slate-900'>
            Advanced SVG Converter
          </h1>
          <p className='text-slate-600 mt-1'>
            Convert images to high-quality SVGs, individually or in batches.
          </p>
        </header>

        {/* Tab Navigation */}
        <div className='flex flex-col sm:flex-row gap-2 mb-6 p-2 bg-slate-100 rounded-lg'>
          <TabButton id='single' label='Single Convert' icon={Image} />
          <TabButton id='batch' label='Batch Convert' icon={Images} />
          <TabButton
            id='gallery'
            label='View Gallery'
            icon={GalleryHorizontal}
          />
        </div>

        {/* Tab Content */}
        <main>{renderContent()}</main>
      </div>
    </div>
  );
}
