"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

export default function MainDisplay() {
  const [currentSession, setCurrentSession] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const displayRef = useRef(null);

  // Poll for live session updates
  const { data: sessionData } = useQuery({
    queryKey: ["live-session"],
    queryFn: async () => {
      const response = await fetch("/api/live-session");
      if (!response.ok) {
        throw new Error("Failed to fetch live session");
      }
      return response.json();
    },
    refetchInterval: 1000, // Poll every second
  });

  useEffect(() => {
    if (sessionData?.session) {
      setCurrentSession(sessionData.session);
    }
  }, [sessionData]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "Escape") {
        exitFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      displayRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!currentSession) {
    return (
      <div
        ref={displayRef}
        className="min-h-screen bg-black flex items-center justify-center text-white"
      >
        <div className="text-center">
          <div className="text-6xl mb-8">🏛️</div>
          <h1 className="text-4xl font-bold mb-4">Church Presenter</h1>
          <p className="text-xl text-gray-300 mb-8">
            Waiting for presentation to start...
          </p>
          <div className="text-sm text-gray-500">
            <p>Press 'F' to enter fullscreen</p>
            <p>Press 'Escape' to exit fullscreen</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentSession.show_camera) {
    return (
      <div
        ref={displayRef}
        className="min-h-screen bg-black flex items-center justify-center"
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-8">📹</div>
            <h2 className="text-3xl font-bold mb-4">Live Camera Feed</h2>
            <p className="text-lg text-gray-300 mb-4">
              {currentSession.camera_name || "Camera Source"}
            </p>
            <div className="text-sm text-gray-500">
              <p>Camera integration coming soon</p>
              <p>WebRTC implementation needed</p>
            </div>
          </div>
        </div>

        {!isFullscreen && (
          <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded">
            Press 'F' for fullscreen
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={displayRef}
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundColor: currentSession.background_color || "#000000",
        color: currentSession.text_color || "#FFFFFF",
      }}
    >
      {currentSession.slide_type === "image" ? (
        <div className="w-full h-full flex items-center justify-center p-4">
          <img
            src={currentSession.slide_content}
            alt={currentSession.slide_title || "Slide"}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-center px-8 py-16"
          style={{
            fontSize: `${currentSession.font_size || 48}px`,
            lineHeight: "1.2",
          }}
        >
          <div className="whitespace-pre-line max-w-6xl">
            {currentSession.slide_content || "No content available"}
          </div>
        </div>
      )}

      {!isFullscreen && (
        <div className="absolute top-4 left-4 text-sm bg-black bg-opacity-50 px-3 py-2 rounded text-white">
          <div className="mb-1">
            <strong>{currentSession.presentation_title}</strong>
          </div>
          <div className="text-xs opacity-75">
            {currentSession.slide_title || "Untitled Slide"}
          </div>
        </div>
      )}

      {!isFullscreen && (
        <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded">
          Press 'F' for fullscreen
        </div>
      )}

      {!isFullscreen && (
        <div className="absolute bottom-4 right-4 text-white text-xs bg-black bg-opacity-50 px-3 py-2 rounded">
          Main Display
        </div>
      )}
    </div>
  );
}
