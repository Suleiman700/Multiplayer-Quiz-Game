'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  description?: string;
  question_count?: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      const cats = await response.json();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/categories?category=${categoryId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadCategories();
        setDeleteConfirm(null);
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin')}
              className="btn-secondary"
            >
              ← Back to Admin
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
              <p className="text-gray-600">View and manage question categories</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/admin/questions/create')}
            className="btn-success"
          >
            ➕ Add Questions to Create Categories
          </button>
        </div>

        {/* Info Card */}
        <div className="card mb-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Categories are automatically created when you add questions. 
                  To create a new category, simply add a question with a new category name.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📂</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500 mb-6">
                Categories are created automatically when you add questions with category names.
              </p>
              <button
                onClick={() => router.push('/admin/questions/create')}
                className="btn-primary"
              >
                Create Your First Question
              </button>
            </div>
          ) : (
            <div>
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">
                  All Categories ({categories.length})
                </h2>
                <p className="text-gray-600">Manage your question categories</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {category.name}
                      </h3>
                      <span className="badge-primary text-lg">
                        {category.question_count}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-6">
                      {category.question_count} question{category.question_count !== 1 ? 's' : ''} in this category
                    </p>

                    <div className="space-y-3">
                      <button
                        onClick={() => router.push(`/admin/questions?category=${category.id}`)}
                        className="w-full btn-secondary"
                      >
                        👁️ View Questions
                      </button>
                      
                      <button
                        onClick={() => router.push(`/admin/questions/create?category=${category.id}`)}
                        className="w-full btn-success"
                      >
                        ➕ Add Question
                      </button>

                      <button
                        onClick={() => setDeleteConfirm(category.id)}
                        className="w-full btn-danger"
                        title={`Delete all ${category.question_count} questions in this category`}
                      >
                        🗑️ Delete Category
                      </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Category ID: <code className="bg-gray-100 px-1 rounded">{category.id}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ⚠️ Confirm Delete Category
              </h3>
              <div className="mb-6">
                <p className="text-gray-600 mb-3">
                  Are you sure you want to delete the <strong>"{deleteConfirm}"</strong> category?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm font-medium">
                    This will permanently delete ALL questions in this category. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCategory(deleteConfirm)}
                  className="btn-danger"
                >
                  Delete Category & All Questions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
