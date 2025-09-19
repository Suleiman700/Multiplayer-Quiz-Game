'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDB } from '@/lib/admin-db';

export default function ImportQuestionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [csvInput, setCsvInput] = useState('');
  const [activeTab, setActiveTab] = useState<'json' | 'csv'>('json');

  const sampleJsonData = `[
  {
    "category": "science",
    "question_text": "What is the chemical symbol for water?",
    "choice_a": "H2O",
    "choice_b": "CO2",
    "choice_c": "NaCl",
    "choice_d": "O2",
    "correct_choice": "A"
  },
  {
    "category": "history",
    "question_text": "In which year did World War II end?",
    "choice_a": "1944",
    "choice_b": "1945",
    "choice_c": "1946",
    "choice_d": "1947",
    "correct_choice": "B"
  }
]`;

  const sampleCsvData = `category,question_text,choice_a,choice_b,choice_c,choice_d,correct_choice
science,"What is the chemical symbol for water?",H2O,CO2,NaCl,O2,A
history,"In which year did World War II end?",1944,1945,1946,1947,B
geography,"What is the capital of France?",London,Berlin,Paris,Madrid,C`;

  const handleJsonImport = async () => {
    try {
      setLoading(true);
      const questions = JSON.parse(jsonInput);
      
      if (!Array.isArray(questions)) {
        throw new Error('JSON must be an array of questions');
      }

      // Validate each question
      for (const question of questions) {
        if (!question.category || !question.question_text || 
            !question.choice_a || !question.choice_b || 
            !question.choice_c || !question.choice_d || 
            !question.correct_choice) {
          throw new Error('Each question must have all required fields');
        }
        
        if (!['A', 'B', 'C', 'D'].includes(question.correct_choice)) {
          throw new Error('correct_choice must be A, B, C, or D');
        }
      }

      const importedCount = await AdminDB.bulkImportQuestions(questions);
      alert(`Successfully imported ${importedCount} questions!`);
      router.push('/admin/questions');
    } catch (error) {
      console.error('Error importing JSON:', error);
      alert(`Error importing questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvImport = async () => {
    try {
      setLoading(true);
      const lines = csvInput.trim().split('\n');
      
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const expectedHeaders = ['category', 'question_text', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'correct_choice'];
      
      for (const header of expectedHeaders) {
        if (!headers.includes(header)) {
          throw new Error(`Missing required column: ${header}`);
        }
      }

      const questions = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const question: any = {};
        
        headers.forEach((header, index) => {
          question[header] = values[index] || '';
        });

        if (!question.category || !question.question_text || 
            !question.choice_a || !question.choice_b || 
            !question.choice_c || !question.choice_d || 
            !question.correct_choice) {
          throw new Error(`Row ${i + 1}: Missing required fields`);
        }
        
        if (!['A', 'B', 'C', 'D'].includes(question.correct_choice)) {
          throw new Error(`Row ${i + 1}: correct_choice must be A, B, C, or D`);
        }

        questions.push(question);
      }

      const importedCount = await AdminDB.bulkImportQuestions(questions);
      alert(`Successfully imported ${importedCount} questions!`);
      router.push('/admin/questions');
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert(`Error importing questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Bulk Import Questions</h1>
              <p className="text-gray-600">Import multiple questions at once using JSON or CSV format</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('json')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'json'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📄 JSON Import
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'csv'
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 CSV Import
            </button>
          </div>
        </div>

        {/* JSON Import Tab */}
        {activeTab === 'json' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">JSON Format</h2>
                <p className="text-gray-600">Import questions using JSON array format</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">JSON Data</label>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Paste your JSON data here..."
                    rows={15}
                    className="input font-mono text-sm"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setJsonInput(sampleJsonData)}
                    className="btn-secondary"
                  >
                    📋 Load Sample Data
                  </button>
                  <button
                    onClick={handleJsonImport}
                    disabled={loading || !jsonInput.trim()}
                    className="btn-primary"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Importing...</span>
                      </div>
                    ) : (
                      'Import Questions'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* JSON Format Guide */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">JSON Format Requirements</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-gray-600">Your JSON must be an array of question objects with these fields:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                  <li><code className="bg-gray-100 px-1 rounded">category</code> - Question category (string)</li>
                  <li><code className="bg-gray-100 px-1 rounded">question_text</code> - The question (string)</li>
                  <li><code className="bg-gray-100 px-1 rounded">choice_a</code> - First answer choice (string)</li>
                  <li><code className="bg-gray-100 px-1 rounded">choice_b</code> - Second answer choice (string)</li>
                  <li><code className="bg-gray-100 px-1 rounded">choice_c</code> - Third answer choice (string)</li>
                  <li><code className="bg-gray-100 px-1 rounded">choice_d</code> - Fourth answer choice (string)</li>
                  <li><code className="bg-gray-100 px-1 rounded">correct_choice</code> - Correct answer: "A", "B", "C", or "D"</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* CSV Import Tab */}
        {activeTab === 'csv' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">CSV Format</h2>
                <p className="text-gray-600">Import questions using CSV (Comma Separated Values) format</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">CSV Data</label>
                  <textarea
                    value={csvInput}
                    onChange={(e) => setCsvInput(e.target.value)}
                    placeholder="Paste your CSV data here..."
                    rows={15}
                    className="input font-mono text-sm"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCsvInput(sampleCsvData)}
                    className="btn-secondary"
                  >
                    📋 Load Sample Data
                  </button>
                  <button
                    onClick={handleCsvImport}
                    disabled={loading || !csvInput.trim()}
                    className="btn-primary"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Importing...</span>
                      </div>
                    ) : (
                      'Import Questions'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* CSV Format Guide */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">CSV Format Requirements</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-gray-600">Your CSV must have these columns in the header row:</p>
                <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                  category,question_text,choice_a,choice_b,choice_c,choice_d,correct_choice
                </div>
                <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                  <li>First row must be the header with column names</li>
                  <li>Use commas to separate values</li>
                  <li>Wrap text containing commas in double quotes</li>
                  <li><code className="bg-gray-100 px-1 rounded">correct_choice</code> must be A, B, C, or D</li>
                  <li>All fields are required for each question</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="card">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Import Tips</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Test with a small batch first to ensure your format is correct</li>
                    <li>Categories will be created automatically if they don't exist</li>
                    <li>Duplicate questions will be added as separate entries</li>
                    <li>Make sure your correct_choice values are exactly "A", "B", "C", or "D"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
