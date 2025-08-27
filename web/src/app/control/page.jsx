'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Camera, 
  Monitor, 
  Smartphone,
  Eye,
  EyeOff,
  Home
} from 'lucide-react';

export default function RemoteControl() {
  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const queryClient = useQueryClient();

  // Fetch presentations
  const { data: presentationsData } = useQuery({
    queryKey: ['presentations'],
    queryFn: async () => {
      const response = await fetch('/api/presentations');
      if (!response.ok) {
        throw new Error('Failed to fetch presentations');
      }
      return response.json();
    },
  });

  // Fetch current live session
  const { data: sessionData } = useQuery({
    queryKey: ['live-session'],
    queryFn: async () => {
      const response = await fetch('/api/live-session');
      if (!response.ok) {
        throw new Error('Failed to fetch live session');
      }
      return response.json();
    },
    refetchInterval: 2000,
  });

  // Fetch selected presentation details
  const { data: presentationData } = useQuery({
    queryKey: ['presentation', selectedPresentation?.id],
    queryFn: async () => {
      const response = await fetch(`/api/presentations/${selectedPresentation.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch presentation');
      }
      return response.json();
    },
    enabled: !!selectedPresentation,
  });

  // Start live session mutation
  const startSessionMutation = useMutation({
    mutationFn: async ({ presentation_id, current_slide_id, show_camera }) => {
      const response = await fetch('/api/live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentation_id,
          current_slide_id,
          camera_source_id: 1,
          show_camera,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to start session');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-session'] });
    },
  });

  // Update live session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updateData) => {
      const response = await fetch('/api/live-session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        throw new Error('Failed to update session');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-session'] });
    },
  });

  const presentations = presentationsData?.presentations || [];
  const currentSession = sessionData?.session;
  const presentation = presentationData?.presentation;
  const slides = presentation?.slides || [];
  const isLive = currentSession?.is_live || false;

  // Find current slide index based on session
  useEffect(() => {
    if (currentSession && slides.length > 0) {
      const slideIndex = slides.findIndex(slide => slide.id === currentSession.current_slide_id);
      if (slideIndex !== -1) {
        setCurrentSlideIndex(slideIndex);
      }
    }
  }, [currentSession, slides]);

  // Auto-select presentation if there's a live session
  useEffect(() => {
    if (currentSession && !selectedPresentation) {
      const livePresentation = presentations.find(p => p.id === currentSession.presentation_id);
      if (livePresentation) {
        setSelectedPresentation(livePresentation);
      }
    }
  }, [currentSession, presentations, selectedPresentation]);

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1 && isLive) {
      const newIndex = currentSlideIndex + 1;
      updateSessionMutation.mutate({
        current_slide_id: slides[newIndex].id,
        show_camera: false,
      });
    }
  };

  const previousSlide = () => {
    if (currentSlideIndex > 0 && isLive) {
      const newIndex = currentSlideIndex - 1;
      updateSessionMutation.mutate({
        current_slide_id: slides[newIndex].id,
        show_camera: false,
      });
    }
  };

  const toggleLive = () => {
    if (!isLive && selectedPresentation && slides.length > 0) {
      startSessionMutation.mutate({
        presentation_id: selectedPresentation.id,
        current_slide_id: slides[0].id,
        show_camera: false,
      });
    }
  };

  const toggleCamera = () => {
    if (isLive) {
      updateSessionMutation.mutate({
        show_camera: !currentSession.show_camera,
      });
    }
  };

  // Handle touch gestures for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      previousSlide();
    }
  };

  if (!selectedPresentation) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center mb-6">
              <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Remote Control</h1>
              <p className="text-gray-600">Select a presentation to control</p>
            </div>

            {currentSession && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-red-800 font-medium">Live Session Active</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  {currentSession.presentation_title}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {presentations.map((presentation) => (
                <button
                  key={presentation.id}
                  onClick={() => setSelectedPresentation(presentation)}
                  className="w-full p-4 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 mb-1">
                    {presentation.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {presentation.slide_count} slides
                  </div>
                </button>
              ))}
            </div>

            {presentations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Monitor className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No presentations available</p>
                <a href="/" className="text-blue-600 hover:text-blue-700 text-sm">
                  Create a presentation
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setSelectedPresentation(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Home className="h-5 w-5" />
            </button>
            <div className={`px-3 py-1 rounded-full text-sm ${
              isLive ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {isLive ? '🔴 LIVE' : '⚫ OFFLINE'}
            </div>
          </div>
          <h1 className="font-bold text-gray-900 mb-1">
            {selectedPresentation.title}
          </h1>
          {isLive && (
            <p className="text-sm text-gray-600">
              Slide {currentSlideIndex + 1} of {slides.length}
            </p>
          )}
        </div>

        {/* Current Slide Preview */}
        {isLive && slides[currentSlideIndex] && (
          <div className="bg-white rounded-lg shadow-sm border mb-4">
            <div className="p-4 border-b">
              <h3 className="font-medium text-gray-900">Current Slide</h3>
            </div>
            <div className="p-4">
              {currentSession.show_camera ? (
                <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📹</div>
                    <p className="text-sm">Camera Feed</p>
                  </div>
                </div>
              ) : (
                <div
                  className="w-full aspect-video rounded-lg flex items-center justify-center text-center p-3"
                  style={{
                    backgroundColor: slides[currentSlideIndex]?.background_color || '#000000',
                    color: slides[currentSlideIndex]?.text_color || '#FFFFFF',
                    fontSize: '12px',
                  }}
                >
                  <div className="whitespace-pre-line line-clamp-6">
                    {slides[currentSlideIndex]?.content || 'No content'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-4">Controls</h3>
          
          {/* Main Controls */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={previousSlide}
              disabled={!isLive || currentSlideIndex === 0}
              className="flex flex-col items-center justify-center p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipBack className="h-6 w-6 mb-1" />
              <span className="text-xs">Previous</span>
            </button>
            
            <button
              onClick={toggleLive}
              disabled={startSessionMutation.isLoading || !slides.length}
              className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${
                isLive
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {isLive ? (
                <>
                  <Pause className="h-6 w-6 mb-1" />
                  <span className="text-xs">Stop</span>
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 mb-1" />
                  <span className="text-xs">Go Live</span>
                </>
              )}
            </button>
            
            <button
              onClick={nextSlide}
              disabled={!isLive || currentSlideIndex === slides.length - 1}
              className="flex flex-col items-center justify-center p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward className="h-6 w-6 mb-1" />
              <span className="text-xs">Next</span>
            </button>
          </div>

          {/* Camera Toggle */}
          <button
            onClick={toggleCamera}
            disabled={!isLive}
            className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors ${
              currentSession?.show_camera
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {currentSession?.show_camera ? (
              <>
                <EyeOff className="h-5 w-5 mr-2" />
                Hide Camera
              </>
            ) : (
              <>
                <Camera className="h-5 w-5 mr-2" />
                Show Camera
              </>
            )}
          </button>

          <div className="mt-4 text-xs text-gray-600 text-center">
            <p>Swipe left/right to navigate slides</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="font-medium text-gray-900 mb-3">Quick Links</h3>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/display"
              target="_blank"
              className="flex items-center justify-center p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Monitor className="h-4 w-4 mr-2" />
              Main Display
            </a>
            <a
              href="/"
              className="flex items-center justify-center p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </a>
          </div>
        </div>

        {/* Notes */}
        {isLive && slides[currentSlideIndex]?.notes && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mt-4">
            <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {slides[currentSlideIndex].notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}