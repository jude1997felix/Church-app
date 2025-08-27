'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Play, Edit, Trash2, Monitor, Smartphone, Globe } from 'lucide-react';

export default function Dashboard() {
  const [showNewPresentation, setShowNewPresentation] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const queryClient = useQueryClient();

  // Fetch presentations
  const { data: presentationsData, isLoading } = useQuery({
    queryKey: ['presentations'],
    queryFn: async () => {
      const response = await fetch('/api/presentations');
      if (!response.ok) {
        throw new Error('Failed to fetch presentations');
      }
      return response.json();
    },
  });

  // Create presentation mutation
  const createPresentationMutation = useMutation({
    mutationFn: async ({ title, description }) => {
      const response = await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (!response.ok) {
        throw new Error('Failed to create presentation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentations'] });
      setShowNewPresentation(false);
      setNewTitle('');
      setNewDescription('');
    },
  });

  // Delete presentation mutation
  const deletePresentationMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/presentations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete presentation');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentations'] });
    },
  });

  const handleCreatePresentation = (e) => {
    e.preventDefault();
    if (newTitle.trim()) {
      createPresentationMutation.mutate({
        title: newTitle.trim(),
        description: newDescription.trim(),
      });
    }
  };

  const presentations = presentationsData?.presentations || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Monitor className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Church Presenter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/display"
                target="_blank"
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Monitor className="h-4 w-4 mr-2" />
                Main Display
              </a>
              <a
                href="/stage"
                target="_blank"
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Stage Display
              </a>
              <a
                href="/control"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Globe className="h-4 w-4 mr-2" />
                Remote Control
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Presentations</h2>
            <button
              onClick={() => setShowNewPresentation(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Presentation
            </button>
          </div>

          {/* New Presentation Form */}
          {showNewPresentation && (
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Presentation</h3>
              <form onSubmit={handleCreatePresentation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sunday Service - Week 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Opening hymns and readings for Sunday service"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={createPresentationMutation.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createPresentationMutation.isLoading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewPresentation(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Presentations Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading presentations...</p>
          </div>
        ) : presentations.length === 0 ? (
          <div className="text-center py-12">
            <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No presentations yet</h3>
            <p className="text-gray-600 mb-6">Create your first presentation to get started</p>
            <button
              onClick={() => setShowNewPresentation(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Presentation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentations.map((presentation) => (
              <div key={presentation.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {presentation.title}
                      </h3>
                      {presentation.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {presentation.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {presentation.slide_count} slides
                      </p>
                    </div>
                    <button
                      onClick={() => deletePresentationMutation.mutate(presentation.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <a
                      href={`/editor/${presentation.id}`}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </a>
                    <a
                      href={`/present/${presentation.id}`}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Present
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}