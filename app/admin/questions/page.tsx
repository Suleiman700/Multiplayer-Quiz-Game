'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Question {
  id?: number;
  category: string;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_choice: 'A' | 'B' | 'C' | 'D';
  created_at?: string;
}

export default function QuestionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const questionsPerPage = 10;

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [currentPage, selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const categories = await response.json();
      setCategories(categories.map((cat: any) => cat.id));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: questionsPerPage.toString(),
        ...(selectedCategory && { category: selectedCategory })
      });
      
      const response = await fetch(`/api/admin/questions?${params}`);
      const data = await response.json();
      setQuestions(data.questions);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadQuestions();
        setDeleteConfirm(null);
      } else {
        throw new Error('Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Error deleting question');
    }
  };

  const filteredQuestions = questions.filter(q =>
    searchTerm === '' || 
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChoiceLetter = (index: number) => ['A', 'B', 'C', 'D'][index];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Questions Management</h1>
              <p className="text-gray-600">View, edit, and manage quiz questions</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/admin/questions/create')}
            className="btn-success"
          >
            ➕ Add New Question
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Search Questions</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by question text or category..."
                className="input"
              />
            </div>
            <div>
              <label className="label">Filter by Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="input"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setCurrentPage(1);
                }}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No questions found</p>
              <button
                onClick={() => router.push('/admin/questions/create')}
                className="btn-primary"
              >
                Create First Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="badge-primary capitalize">{question.category}</span>
                        <span className="text-sm text-gray-500">ID: {question.id}</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        {question.question_text}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => router.push(`/admin/questions/edit/${question.id}`)}
                        className="btn-secondary btn-sm"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(question.id!)}
                        className="btn-danger btn-sm"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {[question.choice_a, question.choice_b, question.choice_c, question.choice_d].map((choice, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded border ${
                          question.correct_choice === getChoiceLetter(index)
                            ? 'bg-success-50 border-success-200 text-success-800'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <span className="font-medium">{getChoiceLetter(index)}:</span> {choice}
                        {question.correct_choice === getChoiceLetter(index) && (
                          <span className="ml-2 text-success-600">✓ Correct</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary btn-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteQuestion(deleteConfirm)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
