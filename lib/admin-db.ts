import { query } from './db-config';

export interface Question {
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

export interface Category {
  id: string;
  name: string;
  description?: string;
  question_count?: number;
}

// Question CRUD operations
export class AdminDB {
  // Get all questions with pagination
  static async getQuestions(page: number = 1, limit: number = 20, category?: string): Promise<{
    questions: Question[];
    total: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      let params: any[] = [];
      
      if (category) {
        whereClause = 'WHERE category = ?';
        params.push(category);
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM questions ${whereClause}`;
      const [countResult] = await query<{total: number}>(countQuery, params);
      const total = countResult.total;
      
      // Get questions
      const questionsQuery = `
        SELECT * FROM questions 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const questions = await query<Question>(questionsQuery, [...params, limit, offset]);
      
      return {
        questions,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting questions:', error);
      throw error;
    }
  }

  // Create new question
  static async createQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<number> {
    try {
      const result = await query(
        `INSERT INTO questions (category, question_text, choice_a, choice_b, choice_c, choice_d, correct_choice)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          question.category,
          question.question_text,
          question.choice_a,
          question.choice_b,
          question.choice_c,
          question.choice_d,
          question.correct_choice
        ]
      );
      return (result as any).insertId;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  // Update question
  static async updateQuestion(id: number, question: Omit<Question, 'id' | 'created_at'>): Promise<boolean> {
    try {
      await query(
        `UPDATE questions 
         SET category = ?, question_text = ?, choice_a = ?, choice_b = ?, choice_c = ?, choice_d = ?, correct_choice = ?
         WHERE id = ?`,
        [
          question.category,
          question.question_text,
          question.choice_a,
          question.choice_b,
          question.choice_c,
          question.choice_d,
          question.correct_choice,
          id
        ]
      );
      return true;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  }

  // Delete question
  static async deleteQuestion(id: number): Promise<boolean> {
    try {
      await query('DELETE FROM questions WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  }

  // Get question by ID
  static async getQuestionById(id: number): Promise<Question | null> {
    try {
      const questions = await query<Question>('SELECT * FROM questions WHERE id = ?', [id]);
      return questions[0] || null;
    } catch (error) {
      console.error('Error getting question by ID:', error);
      throw error;
    }
  }

  // Category operations
  static async getCategories(): Promise<Category[]> {
    try {
      const categories = await query<{category: string, count: number}>(
        'SELECT category, COUNT(*) as count FROM questions GROUP BY category ORDER BY category'
      );
      
      return categories.map(cat => ({
        id: cat.category,
        name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
        question_count: cat.count
      }));
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Get all unique categories (for dropdown)
  static async getAllCategories(): Promise<string[]> {
    try {
      const result = await query<{category: string}>('SELECT DISTINCT category FROM questions ORDER BY category');
      return result.map(row => row.category);
    } catch (error) {
      console.error('Error getting all categories:', error);
      throw error;
    }
  }

  // Delete all questions in a category
  static async deleteCategory(category: string): Promise<boolean> {
    try {
      await query('DELETE FROM questions WHERE category = ?', [category]);
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Bulk import questions
  static async bulkImportQuestions(questions: Omit<Question, 'id' | 'created_at'>[]): Promise<number> {
    try {
      let importedCount = 0;
      
      for (const question of questions) {
        await this.createQuestion(question);
        importedCount++;
      }
      
      return importedCount;
    } catch (error) {
      console.error('Error bulk importing questions:', error);
      throw error;
    }
  }

  // Get statistics
  static async getStatistics(): Promise<{
    totalQuestions: number;
    totalCategories: number;
    questionsByCategory: Record<string, number>;
  }> {
    try {
      const [totalResult] = await query<{total: number}>('SELECT COUNT(*) as total FROM questions');
      const categories = await query<{category: string, count: number}>(
        'SELECT category, COUNT(*) as count FROM questions GROUP BY category'
      );
      
      const questionsByCategory: Record<string, number> = {};
      categories.forEach(cat => {
        questionsByCategory[cat.category] = cat.count;
      });
      
      return {
        totalQuestions: totalResult.total,
        totalCategories: categories.length,
        questionsByCategory
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }
}
