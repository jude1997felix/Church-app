"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Eye, FileText, ArrowRight } from "lucide-react";

export default function StageDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    refetchInterval: 1000,
  });

  // Fetch presentation details if we have a session
  const { data: presentationData } = useQuery({
    queryKey: ["presentation", sessionData?.session?.presentation_id],
    queryFn: async () => {
      const response = await fetch(
        `/api/presentations/${sessionData.session.presentation_id}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch presentation");
      }
      return response.json();
    },
    enabled: !!sessionData?.session?.presentation_id,
  });

  const currentSession = sessionData?.session;
  const presentation = presentationData?.presentation;
  const slides = presentation?.slides || [];

  // Find current and next slide
  const currentSlideIndex = slides.findIndex(
    (slide) => slide.id === currentSession?.current_slide_id,
  );
  const currentSlide = slides[currentSlideIndex];
  const nextSlide =
    currentSlideIndex >= 0 && currentSlideIndex < slides.length - 1
      ? slides[currentSlideIndex + 1]
      : null;

  // Set session start time when going live
  useEffect(() => {
    if (currentSession?.is_live && !sessionStartTime) {
      setSessionStartTime(new Date());
    } else if (!currentSession?.is_live) {
      setSessionStartTime(null);
    }
  }, [currentSession?.is_live, sessionStartTime]);

  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!sessionStartTime) return "00:00:00";

    const elapsed = Math.floor((currentTime - sessionStartTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentSession || !currentSession.is_live) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-8">🎭</div>
          <h1 className="text-4xl font-bold mb-4">Stage Display</h1>
          <p className="text-xl text-gray-300 mb-8">
            Waiting for presentation to start...
          </p>
          <div className="text-lg">
            <Clock className="inline h-6 w-6 mr-2" />
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  }

  if (currentSession.show_camera) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">
                {currentSession.presentation_title}
              </h1>
              <p className="text-gray-300">Camera Feed Active</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-300">
                Live: {getElapsedTime()}
              </div>
            </div>
          </div>
        </div>

        {/* Camera Status */}
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-8xl mb-8">📹</div>
            <h2 className="text-4xl font-bold mb-4">Live Camera Feed</h2>
            <p className="text-xl text-gray-300 mb-8">
              {currentSession.camera_name || "Camera Source"}
            </p>
            <div className="bg-red-600 px-6 py-3 rounded-lg inline-block">
              <span className="text-lg font-bold">🔴 ON AIR</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">
              {currentSession.presentation_title}
            </h1>
            <p className="text-gray-300">
              Slide {currentSlideIndex + 1} of {slides.length}
              {currentSlide?.title && ` - ${currentSlide.title}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-300">
              Live: {getElapsedTime()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
          {/* Current Slide Info */}
          <div className="space-y-6">
            {/* Current Slide Preview */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Eye className="h-5 w-5 mr-2 text-blue-400" />
                <h2 className="text-lg font-semibold">Current Slide</h2>
              </div>
              {currentSlide && (
                <div
                  className="w-full aspect-video rounded-lg flex items-center justify-center text-center p-4 mb-3 overflow-hidden"
                  style={{
                    backgroundColor:
                      currentSlide.slide_type === "image"
                        ? "#000000"
                        : currentSlide.background_color || "#000000",
                    color: currentSlide.text_color || "#FFFFFF",
                    fontSize: "14px",
                  }}
                >
                  {currentSlide.slide_type === "image" ? (
                    <img
                      src={currentSlide.content}
                      alt={currentSlide.title || "Slide"}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="whitespace-pre-line line-clamp-8">
                      {currentSlide.content}
                    </div>
                  )}
                </div>
              )}
              <div className="text-sm text-gray-400">
                {currentSlide?.title || "Untitled Slide"}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-gray-800 rounded-lg p-4 flex-1">
              <div className="flex items-center mb-3">
                <FileText className="h-5 w-5 mr-2 text-yellow-400" />
                <h2 className="text-lg font-semibold">Notes</h2>
              </div>
              <div className="text-gray-300 whitespace-pre-line">
                {currentSlide?.notes || (
                  <span className="text-gray-500 italic">
                    No notes for this slide
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Next Slide & Controls */}
          <div className="space-y-6">
            {/* Next Slide Preview */}
            {nextSlide ? (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <ArrowRight className="h-5 w-5 mr-2 text-green-400" />
                  <h2 className="text-lg font-semibold">Next Slide</h2>
                </div>
                <div
                  className="w-full aspect-video rounded-lg flex items-center justify-center text-center p-4 mb-3 overflow-hidden"
                  style={{
                    backgroundColor:
                      nextSlide.slide_type === "image"
                        ? "#000000"
                        : nextSlide.background_color || "#000000",
                    color: nextSlide.text_color || "#FFFFFF",
                    fontSize: "12px",
                  }}
                >
                  {nextSlide.slide_type === "image" ? (
                    <img
                      src={nextSlide.content}
                      alt={nextSlide.title || "Next Slide"}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="whitespace-pre-line line-clamp-6">
                      {nextSlide.content}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {nextSlide.title || "Untitled Slide"}
                </div>
                {nextSlide.notes && (
                  <div className="mt-3 p-3 bg-gray-700 rounded text-sm text-gray-300">
                    <strong>Next slide notes:</strong>
                    <div className="mt-1 whitespace-pre-line">
                      {nextSlide.notes}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <ArrowRight className="h-5 w-5 mr-2 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-500">
                    Next Slide
                  </h2>
                </div>
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🏁</div>
                  <p>This is the last slide</p>
                </div>
              </div>
            )}

            {/* Session Info */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Session Info</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-red-400 font-semibold">🔴 LIVE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Slides:</span>
                  <span>{slides.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Remaining:</span>
                  <span>{slides.length - currentSlideIndex - 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Progress:</span>
                  <span>
                    {Math.round(
                      ((currentSlideIndex + 1) / slides.length) * 100,
                    )}
                    %
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentSlideIndex + 1) / slides.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Reference */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Quick Reference</h2>
              <div className="text-sm text-gray-300 space-y-1">
                <p>
                  <strong>Remote Control:</strong> Use phone/tablet to advance
                  slides
                </p>
                <p>
                  <strong>Main Display:</strong> What the congregation sees
                </p>
                <p>
                  <strong>Stage Display:</strong> This presenter view
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
