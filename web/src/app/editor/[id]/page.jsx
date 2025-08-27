"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Save,
  Trash2,
  ArrowLeft,
  Eye,
  Play,
  Camera,
  Monitor,
  Upload,
  FileText,
  Image,
} from "lucide-react";
import useUpload from "@/utils/useUpload";

export default function PresentationEditor({ params }) {
  const { id } = params;
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [showNewSlide, setShowNewSlide] = useState(false);
  const [newSlideType, setNewSlideType] = useState("text"); // 'text' or 'image'
  const [newSlideData, setNewSlideData] = useState({
    title: "",
    content: "",
    slide_type: "text",
    background_color: "#000000",
    text_color: "#FFFFFF",
    font_size: 48,
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();
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

  // Create slide mutation
  const createSlideMutation = useMutation({
    mutationFn: async (slideData) => {
      const response = await fetch("/api/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...slideData, presentation_id: parseInt(id) }),
      });
      if (!response.ok) {
        throw new Error("Failed to create slide");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presentation", id] });
      setShowNewSlide(false);
      setNewSlideData({
        title: "",
        content: "",
        slide_type: "text",
        background_color: "#000000",
        text_color: "#FFFFFF",
        font_size: 48,
        notes: "",
      });
      setSelectedFile(null);
      setNewSlideType("text");
    },
  });

  // Update slide mutation
  const updateSlideMutation = useMutation({
    mutationFn: async ({ slideId, ...updateData }) => {
      const response = await fetch(`/api/slides/${slideId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        throw new Error("Failed to update slide");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presentation", id] });
    },
  });

  // Delete slide mutation
  const deleteSlideMutation = useMutation({
    mutationFn: async (slideId) => {
      const response = await fetch(`/api/slides/${slideId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete slide");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presentation", id] });
      setSelectedSlide(null);
    },
  });

  const presentation = presentationData?.presentation;
  const slides = presentation?.slides || [];

  const handleCreateSlide = async (e) => {
    e.preventDefault();

    if (newSlideType === "image" && selectedFile) {
      // Upload the image first
      const { url, error } = await upload({ file: selectedFile });
      if (error) {
        console.error("Upload failed:", error);
        return;
      }

      // Create slide with image URL
      createSlideMutation.mutate({
        ...newSlideData,
        slide_type: "image",
        content: url, // Store image URL in content field
      });
    } else if (newSlideType === "text" && newSlideData.content.trim()) {
      // Create text slide
      createSlideMutation.mutate({
        ...newSlideData,
        slide_type: "text",
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      // Update title with filename if empty
      if (!newSlideData.title) {
        setNewSlideData((prev) => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        }));
      }
    }
  };

  const resetNewSlideData = () => {
    setNewSlideData({
      title: "",
      content: "",
      slide_type: "text",
      background_color: "#000000",
      text_color: "#FFFFFF",
      font_size: 48,
      notes: "",
    });
    setSelectedFile(null);
    setNewSlideType("text");
  };

  const handleUpdateSlide = (field, value) => {
    if (selectedSlide) {
      const updatedSlide = { ...selectedSlide, [field]: value };
      setSelectedSlide(updatedSlide);
      updateSlideMutation.mutate({ slideId: selectedSlide.id, [field]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Presentation not found
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
                {slides.length} slides
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowNewSlide(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Slide
              </button>
              <a
                href={`/present/${id}`}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="h-4 w-4 mr-2" />
                Present
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    onClick={() => setSelectedSlide(slide)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSlide?.id === slide.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlideMutation.mutate(slide.id);
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {slides.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Monitor className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No slides yet</p>
                    <p className="text-sm">
                      Add your first slide to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Slide Editor */}
          <div className="lg:col-span-2">
            {selectedSlide ? (
              <div className="space-y-6">
                {/* Preview */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b">
                    <h3 className="font-medium text-gray-900">Preview</h3>
                  </div>
                  <div className="p-4">
                    <div
                      className="w-full aspect-video rounded-lg flex items-center justify-center text-center overflow-hidden"
                      style={{
                        backgroundColor:
                          selectedSlide.slide_type === "image"
                            ? "#000000"
                            : selectedSlide.background_color,
                        color: selectedSlide.text_color,
                        fontSize: `${Math.max(selectedSlide.font_size / 4, 12)}px`,
                      }}
                    >
                      {selectedSlide.slide_type === "image" ? (
                        <img
                          src={selectedSlide.content}
                          alt={selectedSlide.title || "Slide"}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="whitespace-pre-line p-8">
                          {selectedSlide.content}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Editor */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b">
                    <h3 className="font-medium text-gray-900">Edit Slide</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={selectedSlide.title || ""}
                        onChange={(e) =>
                          handleUpdateSlide("title", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Slide title"
                      />
                    </div>

                    {selectedSlide.slide_type === "text" ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content
                          </label>
                          <textarea
                            value={selectedSlide.content}
                            onChange={(e) =>
                              handleUpdateSlide("content", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="8"
                            placeholder="Enter slide content..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Background Color
                            </label>
                            <input
                              type="color"
                              value={selectedSlide.background_color}
                              onChange={(e) =>
                                handleUpdateSlide(
                                  "background_color",
                                  e.target.value,
                                )
                              }
                              className="w-full h-10 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Text Color
                            </label>
                            <input
                              type="color"
                              value={selectedSlide.text_color}
                              onChange={(e) =>
                                handleUpdateSlide("text_color", e.target.value)
                              }
                              className="w-full h-10 border border-gray-300 rounded-md"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Font Size
                            </label>
                            <input
                              type="number"
                              value={selectedSlide.font_size}
                              onChange={(e) =>
                                handleUpdateSlide(
                                  "font_size",
                                  parseInt(e.target.value),
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="12"
                              max="120"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-2">
                          <Image className="h-5 w-5 mr-2" />
                          <span className="font-medium">Image Slide</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          This is an image slide. To change the image, create a
                          new slide.
                        </p>
                        <div className="mt-2 text-xs text-gray-400">
                          Image URL: {selectedSlide.content}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (for stage display)
                      </label>
                      <textarea
                        value={selectedSlide.notes || ""}
                        onChange={(e) =>
                          handleUpdateSlide("notes", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Notes for the presenter..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-8 text-center">
                  <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a slide to edit
                  </h3>
                  <p className="text-gray-600">
                    Choose a slide from the list to start editing
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Slide Modal */}
      {showNewSlide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New Slide
              </h3>

              {/* Slide Type Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slide Type
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setNewSlideType("text")}
                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                      newSlideType === "text"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Text Slide
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSlideType("image")}
                    className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                      newSlideType === "image"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Image Slide
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateSlide} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newSlideData.title}
                    onChange={(e) =>
                      setNewSlideData({
                        ...newSlideData,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Slide title"
                  />
                </div>

                {newSlideType === "image" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <div className="mb-4">
                          <label
                            htmlFor="slide-upload"
                            className="cursor-pointer"
                          >
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Choose image file
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              PNG, JPG, JPEG up to 10MB
                            </span>
                          </label>
                          <input
                            id="slide-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="sr-only"
                            required
                          />
                        </div>
                        {selectedFile && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-800">
                              Selected: {selectedFile.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content
                      </label>
                      <textarea
                        value={newSlideData.content}
                        onChange={(e) =>
                          setNewSlideData({
                            ...newSlideData,
                            content: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="6"
                        placeholder="Enter slide content..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={newSlideData.background_color}
                          onChange={(e) =>
                            setNewSlideData({
                              ...newSlideData,
                              background_color: e.target.value,
                            })
                          }
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={newSlideData.text_color}
                          onChange={(e) =>
                            setNewSlideData({
                              ...newSlideData,
                              text_color: e.target.value,
                            })
                          }
                          className="w-full h-10 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Font Size
                        </label>
                        <input
                          type="number"
                          value={newSlideData.font_size}
                          onChange={(e) =>
                            setNewSlideData({
                              ...newSlideData,
                              font_size: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="12"
                          max="120"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={newSlideData.notes}
                    onChange={(e) =>
                      setNewSlideData({
                        ...newSlideData,
                        notes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Notes for the presenter..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewSlide(false);
                      resetNewSlideData();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createSlideMutation.isLoading ||
                      uploadLoading ||
                      (newSlideType === "image" && !selectedFile)
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createSlideMutation.isLoading || uploadLoading
                      ? "Creating..."
                      : "Create Slide"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
