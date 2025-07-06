"use client";

import React from "react";

const YouTubeEmbed = ({ url }) => {
  /**
   * Extracts the YouTube video ID from various URL formats.
   * @param {string} youtubeUrl The full YouTube URL.
   * @returns {string|null} The 11-character video ID or null if not found.
   */
  const getVideoId = (youtubeUrl) => {
    if (!youtubeUrl) {
      return null;
    }
    // This regex handles youtube.com/watch, youtu.be/, and youtube.com/embed/ links
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = youtubeUrl.match(regExp);

    if (match && match[2].length === 11) {
      return match[2];
    } else {
      console.error(
        "Could not extract a valid YouTube video ID from the URL:",
        youtubeUrl
      );
      return null;
    }
  };

  const videoId = getVideoId(url);

  // If no valid video ID could be extracted, don't render anything.
  if (!videoId) {
    return null;
  }

  return (
    <div className='my-12'>
      {/* This container creates a responsive 16:9 aspect ratio box */}
      <div className='relative w-full aspect-video overflow-hidden rounded-2xl shadow-xl border border-slate-200'>
        <iframe
          className='absolute top-0 left-0 w-full h-full'
          src={`https://www.youtube.com/embed/${videoId}`}
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
