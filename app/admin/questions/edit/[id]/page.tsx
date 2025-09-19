'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
// import { AdminDB, Question } from '@/lib/admin-db';

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
export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = parseInt(params.id as string);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    category: '',
    question_text: '',
    choice_a: '',
    choice_b: '',
    choice_c: '',
    choice_d: '',
    correct_choice: 'A' as 'A' | 'B' | 'C' | 'D'
  });

  useEffect(() => {
    loadData();
  }, [questionId]);

  const loadData = async () => {
    try {
      setInitialLoading(true);
      const [questionResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/admin/questions/${questionId}`),
        fetch('/api/admin/categories')
      ]);
      
      const question = await questionResponse.json();
      const categories = await categoriesResponse.json();
      
      if (!questionResponse.ok || !question) {
        alert('Question not found');
        router.push('/admin/questions');
        return;
      }

      setFormData({
        category: question.category,
        question_text: question.question_text,
        choice_a: question.choice_a,
        choice_b: question.choice_b,
        choice_c: question.choice_c,
        choice_d: question.choice_d,
        correct_choice: question.correct_choice
      });
      
      setCategories(categories.map((cat: any) => cat.id));
    } catch (error) {
      console.error('Error loading question:', error);
      alert('Error loading question');
      router.push('/admin/questions');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category.trim() || !formData.question_text.trim() || 
        !formData.choice_a.trim() || !formData.choice_b.trim() || 
        !formData.choice_c.trim() || !formData.choice_d.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: formData.category.toLowerCase().trim(),
          question_text: formData.question_text.trim(),
          choice_a: formData.choice_a.trim(),
          choice_b: formData.choice_b.trim(),
          choice_c: formData.choice_c.trim(),
          choice_d: formData.choice_d.trim(),
          correct_choice: formData.correct_choice
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update question');
      }
      
      alert('Question updated successfully!');
      router.push('/admin/questions');
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Error updating question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/questions')}
              className="btn-secondary"
            >
              ← Back to Questions
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Question</h1>
              <p className="text-gray-600">Update question ID: {questionId}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Question Details</h2>
            </div>

            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="label">Category *</label>
                <div className="flex space-x-3">
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="input flex-1"
                  >
                    <option value="">Select existing category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="capitalize">
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-500 self-center">OR</span>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Create new category..."
                    className="input flex-1"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Select an existing category or type a new one (e.g., science, history, sports)
                </p>
              </div>

              {/* Question Text */}
              <div>
                <label className="label">Question Text *</label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => handleInputChange('question_text', e.target.value)}
                  placeholder="Enter your question here..."
                  rows={3}
                  className="input"
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.question_text.length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Answer Choices */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Answer Choices</h2>
              <p className="text-gray-600">Enter all four answer choices and select the correct one</p>
            </div>

            <div className="space-y-4">
              {(['A', 'B', 'C', 'D'] as const).map((letter, index) => (
                <div key={letter} className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="correct_choice"
                      value={letter}
                      checked={formData.correct_choice === letter}
                      onChange={(e) => handleInputChange('correct_choice', e.target.value)}
                      className="w-4 h-4 text-success-600 focus:ring-success-500"
                    />
                    <label className="ml-2 font-medium text-gray-700">
                      {letter}:
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData[`choice_${letter.toLowerCase()}` as keyof typeof formData]}
                    onChange={(e) => handleInputChange(`choice_${letter.toLowerCase()}`, e.target.value)}
                    placeholder={`Enter choice ${letter}...`}
                    className="input flex-1"
                    maxLength={200}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> Select the radio button next to the correct answer choice.
                Currently selected: <strong>Choice {formData.correct_choice}</strong>
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="badge-primary capitalize">
                  {formData.category || 'No Category'}
                </span>
              </div>
              
              <div className="text-lg font-medium text-gray-900">
                {formData.question_text || 'Question text will appear here...'}
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                  const choice = formData[`choice_${letter.toLowerCase()}` as keyof typeof formData];
                  const isCorrect = formData.correct_choice === letter;
                  
                  return (
                    <div
                      key={letter}
                      className={`p-3 rounded border ${
                        isCorrect
                          ? 'bg-success-50 border-success-200 text-success-800'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className="font-medium">{letter}:</span> {choice || `Choice ${letter}...`}
                      {isCorrect && (
                        <span className="ml-2 text-success-600">✓ Correct</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin/questions')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Question'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
