'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  description?: string;
  question_count?: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<{
    totalQuestions: number;
    totalCategories: number;
    questionsByCategory: Record<string, number>;
  } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/categories')
      ]);
      
      const statsData = await statsResponse.json();
      const categoriesData = await categoriesResponse.json();
      
      setStats(statsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/')}
              className="btn-secondary"
            >
              ← Back to Game
            </button>
            <h1 className="text-4xl font-bold gradient-text">Admin Dashboard</h1>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
          <p className="text-gray-600">Manage quiz categories and questions</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {stats.totalQuestions}
              </div>
              <div className="text-gray-600">Total Questions</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-success-600 mb-2">
                {stats.totalCategories}
              </div>
              <div className="text-gray-600">Categories</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round(stats.totalQuestions / Math.max(stats.totalCategories, 1))}
              </div>
              <div className="text-gray-600">Avg Questions/Category</div>
            </div>
          </div>
        )}

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Questions Management */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-2xl font-semibold text-gray-900">Questions</h2>
              <p className="text-gray-600">Manage quiz questions</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => router.push('/admin/questions')}
                className="w-full btn-primary btn-lg"
              >
                📝 Manage Questions
              </button>
              <button
                onClick={() => router.push('/admin/questions/create')}
                className="w-full btn-success btn-lg"
              >
                ➕ Add New Question
              </button>
              <button
                onClick={() => router.push('/admin/questions/import')}
                className="w-full btn-secondary btn-lg"
              >
                📁 Bulk Import Questions
              </button>
            </div>
          </div>

          {/* Categories Management */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-2xl font-semibold text-gray-900">Categories</h2>
              <p className="text-gray-600">Manage question categories</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => router.push('/admin/categories')}
                className="w-full btn-primary btn-lg"
              >
                🏷️ Manage Categories
              </button>
              <div className="text-sm text-gray-500">
                Categories are automatically created when you add questions
              </div>
            </div>
          </div>
        </div>

        {/* Categories Overview */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Categories Overview</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 capitalize">{category.name}</h3>
                  <span className="badge-primary">{category.question_count}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {category.question_count} question{category.question_count !== 1 ? 's' : ''}
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => router.push(`/admin/questions?category=${category.id}`)}
                    className="text-xs btn-secondary px-2 py-1"
                  >
                    View
                  </button>
                  <button
                    onClick={() => router.push(`/admin/questions/create?category=${category.id}`)}
                    className="text-xs btn-success px-2 py-1"
                  >
                    Add Question
                  </button>
                </div>
              </div>
            ))}
          </div>
          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No categories found. Create your first question to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
