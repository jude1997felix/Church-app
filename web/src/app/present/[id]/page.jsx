"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Camera,
  Monitor,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

export default function PresentationControl({ params }) {
  const { id } = params;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const queryClient = useQueryClient();

  // Fetch presentation with slides
  const { data: presentationData, isLoading } = useQuery({
    queryKey: ["presentation", id],
    queryFn: async () => {
      const response = await fetch(`/api/presentations/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch presentation");
      }
      return response.json();
    },
  });

  // Fetch current live session
  const { data: sessionData } = useQuery({
    queryKey: ["live-session"],
    queryFn: async () => {
      const response = await fetch("/api/live-session");
      if (!response.ok) {
        throw new Error("Failed to fetch live session");
      }
      return response.json();
    },
    refetchInterval: 2000,
  });

  // Start live session mutation
  const startSessionMutation = useMutation({
    mutationFn: async ({ presentation_id, current_slide_id, show_camera }) => {
      const response = await fetch("/api/live-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentation_id,
          current_slide_id,
          camera_source_id: 1, // Default camera
          show_camera,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to start session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-session"] });
      setIsLive(true);
    },
  });

  // Update live session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updateData) => {
      const response = await fetch("/api/live-session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        throw new Error("Failed to update session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-session"] });
    },
  });

  const presentation = presentationData?.presentation;
  const slides = presentation?.slides || [];
  const currentSlide = slides[currentSlideIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        previousSlide();
      } else if (e.key === "Enter") {
        e.preventDefault();
        toggleLive();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        toggleCamera();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentSlideIndex, isLive, showCamera]);

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      const newIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(newIndex);
      if (isLive) {
        updateSessionMutation.mutate({
          current_slide_id: slides[newIndex].id,
          show_camera: false,
        });
        setShowCamera(false);
      }
    }
  };

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      const newIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(newIndex);
      if (isLive) {
        updateSessionMutation.mutate({
          current_slide_id: slides[newIndex].id,
          show_camera: false,
        });
        setShowCamera(false);
      }
    }
  };

  const goToSlide = (index) => {
    setCurrentSlideIndex(index);
    if (isLive) {
      updateSessionMutation.mutate({
        current_slide_id: slides[index].id,
        show_camera: false,
      });
      setShowCamera(false);
    }
  };

  const toggleLive = () => {
    if (!isLive && currentSlide) {
      startSessionMutation.mutate({
        presentation_id: parseInt(id),
        current_slide_id: currentSlide.id,
        show_camera: false,
      });
    }
  };

  const toggleCamera = () => {
    if (isLive) {
      const newShowCamera = !showCamera;
      setShowCamera(newShowCamera);
      updateSessionMutation.mutate({
        show_camera: newShowCamera,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!presentation || slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {!presentation
              ? "Presentation not found"
              : "No slides in presentation"}
          </h2>
          <a href="/" className="text-blue-600 hover:text-blue-700">
            Return to dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-gray-400 hover:text-gray-600 mr-4">
                <ArrowLeft className="h-6 w-6" />
              </a>
              <h1 className="text-xl font-semibold text-gray-900">
                {presentation.title}
              </h1>
              <span className="ml-3 text-sm text-gray-500">
                Slide {currentSlideIndex + 1} of {slides.length}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className={`px-3 py-1 rounded-full text-sm ${
                  isLive
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {isLive ? "🔴 LIVE" : "⚫ OFFLINE"}
              </div>
              <a
                href="/display"
                target="_blank"
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Monitor className="h-4 w-4 mr-2" />
                View Display
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Current Slide Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Current Slide</h3>
              </div>
              <div className="p-4">
                {showCamera ? (
                  <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📹</div>
                      <h3 className="text-xl font-bold mb-2">Camera Feed</h3>
                      <p className="text-sm text-gray-300">Live camera view</p>
                    </div>
                  </div>
                ) : currentSlide?.slide_type === "image" ? (
                  <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={currentSlide.content}
                      alt={currentSlide.title || "Slide"}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full aspect-video rounded-lg flex items-center justify-center text-center p-4"
                    style={{
                      backgroundColor:
                        currentSlide?.background_color || "#000000",
                      color: currentSlide?.text_color || "#FFFFFF",
                      fontSize: `${Math.max((currentSlide?.font_size || 48) / 6, 10)}px`,
                    }}
                  >
                    <div className="whitespace-pre-line">
                      {currentSlide?.content || "No content"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Controls</h3>
              </div>
              <div className="p-4">
                <div className="flex justify-center space-x-4 mb-6">
                  <button
                    onClick={previousSlide}
                    disabled={currentSlideIndex === 0}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipBack className="h-4 w-4 mr-2" />
                    Previous
                  </button>

                  <button
                    onClick={toggleLive}
                    disabled={startSessionMutation.isLoading}
                    className={`flex items-center px-6 py-2 rounded-lg transition-colors ${
                      isLive
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {isLive ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Live
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Go Live
                      </>
                    )}
                  </button>

                  <button
                    onClick={nextSlide}
                    disabled={currentSlideIndex === slides.length - 1}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <SkipForward className="h-4 w-4 ml-2" />
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={toggleCamera}
                    disabled={!isLive}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      showCamera
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-600 text-white hover:bg-gray-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {showCamera ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Camera
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Show Camera
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 text-sm text-gray-600 text-center">
                  <p>
                    <strong>Keyboard shortcuts:</strong>
                  </p>
                  <p>→ / Space: Next slide | ← : Previous slide</p>
                  <p>Enter: Toggle live | C: Toggle camera</p>
                </div>
              </div>
            </div>
          </div>

          {/* Slides List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Slides</h3>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    onClick={() => goToSlide(index)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      index === currentSlideIndex
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      Slide {index + 1}
                    </div>
                    <div className="font-medium text-sm text-gray-900 mb-1">
                      {slide.title || "Untitled"}
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {slide.content.substring(0, 50)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Notes</h3>
              </div>
              <div className="p-4">
                {currentSlide?.notes ? (
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {currentSlide.notes}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No notes for this slide
                  </div>
                )}
              </div>
            </div>

            {/* Next Slide Preview */}
            {currentSlideIndex < slides.length - 1 && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-gray-900">Next Slide</h3>
                </div>
                <div className="p-4">
                  <div
                    className="w-full aspect-video rounded-lg flex items-center justify-center text-center p-2 text-xs"
                    style={{
                      backgroundColor:
                        slides[currentSlideIndex + 1]?.background_color ||
                        "#000000",
                      color:
                        slides[currentSlideIndex + 1]?.text_color || "#FFFFFF",
                    }}
                  >
                    <div className="whitespace-pre-line line-clamp-4">
                      {slides[currentSlideIndex + 1]?.content || "No content"}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {slides[currentSlideIndex + 1]?.title || "Untitled"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
