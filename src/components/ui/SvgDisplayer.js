"use client";

import { useState, useEffect } from "react";

/**
 * A smart component that displays an SVG. It attempts to parse the SVG
 * to find and render text content as a native HTML element for better
 * clarity and wrapping. If it's a non-text SVG, it renders the SVG directly.
 * @param {object} props
 * @param {string} props.svgCode The string of SVG code to display.
 * @param {string} props.className The CSS classes for the container.
 */
export default function SvgDisplayer({ svgCode, className }) {
  const [displayText, setDisplayText] = useState(null);
  const [isText, setIsText] = useState(false);

  useEffect(() => {
    if (!svgCode) return;

    try {
      // Create a parser to read the SVG string as a document
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgCode, "image/svg+xml");

      // Try to find the div we created inside the <foreignObject>
      const textElement = svgDoc.querySelector("foreignObject > div > div");

      if (textElement && textElement.textContent) {
        // If we find the text, update state to render it as HTML
        setDisplayText(textElement.textContent);
        setIsText(true);
      } else {
        // If not, it's a regular image SVG
        setIsText(false);
      }
    } catch (error) {
      // If parsing fails, treat it as a regular SVG
      console.error("SVG parsing error:", error);
      setIsText(false);
    }
  }, [svgCode]); // Rerun this logic whenever the SVG code changes

  if (isText) {
    // RENDER AS NATIVE HTML TEXT: It will look crisp and wrap perfectly.
    return (
      <div className={className}>
        <p className='p-4 text-slate-800'>{displayText}</p>
      </div>
    );
  } else {
    // RENDER AS AN SVG IMAGE: For questions that are actual images.
    return (
      <div
        className={`${className} [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain`}
        dangerouslySetInnerHTML={{ __html: svgCode }}
      />
    );
  }
}
