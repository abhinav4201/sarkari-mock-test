"use client";

import React, { useState, useEffect } from "react";

const YouTubeEmbed = ({ url }) => {
  const [videoInfo, setVideoInfo] = useState({ id: null, isShort: false });

  useEffect(() => {
    /**
     * Extracts the YouTube video ID from valid URL formats and detects if it's a Short.
     * @param {string} youtubeUrl The full YouTube URL.
     * @returns {object|null} An object with the video ID and isShort boolean, or null.
     */
    const getVideoInfo = (youtubeUrl) => {
      if (!youtubeUrl) {
        return null;
      }

      // FIX: This new regex correctly handles all valid YouTube domains (youtube.com, youtu.be)
      // and formats (/watch, /embed, /shorts). It no longer contains the incorrect googleusercontent URL.
      const regExp =
        /(?:youtube\.com\/(?:embed\/|shorts\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

      const match = youtubeUrl.match(regExp);
      const isShort = youtubeUrl.includes("/shorts/");

      if (match && match[1]) {
        return { id: match[1], isShort: isShort };
      } else {
        console.error(
          "Could not extract a valid YouTube video ID from the URL:",
          youtubeUrl
        );
        return null;
      }
    };

    const info = getVideoInfo(url);
    if (info) {
      setVideoInfo(info);
    }
  }, [url]);

  if (!videoInfo.id) {
    return null;
  }

  // Dynamically set the aspect ratio class based on whether it's a Short.
  const aspectRatioClass = videoInfo.isShort ? "aspect-[9/16]" : "aspect-video";
  const containerMaxWidthClass = videoInfo.isShort
    ? "max-w-sm mx-auto"
    : "w-full";

  return (
    <div className={`my-12 ${containerMaxWidthClass}`}>
      <div
        className={`relative ${aspectRatioClass} overflow-hidden rounded-2xl shadow-xl border border-slate-200`}
      >
        <iframe
          className='absolute top-0 left-0 w-full h-full'
          src={`https://youtube.com/embed/${videoInfo.id}`}
          title='YouTube video player'
          frameBorder='0'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default YouTubeEmbed;
