import { NextRequest, NextResponse } from 'next/server';
import { AdminDB } from '@/lib/admin-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions } = body;

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Questions must be an array' },
        { status: 400 }
      );
    }

    // Validate questions format
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.category || !question.question_text || 
          !question.choice_a || !question.choice_b || 
          !question.choice_c || !question.choice_d || 
          !question.correct_choice) {
        return NextResponse.json(
          { error: `Question ${i + 1}: Missing required fields` },
          { status: 400 }
        );
      }
      
      if (!['A', 'B', 'C', 'D'].includes(question.correct_choice)) {
        return NextResponse.json(
          { error: `Question ${i + 1}: correct_choice must be A, B, C, or D` },
          { status: 400 }
        );
      }
    }

    const importedCount = await AdminDB.bulkImportQuestions(questions);
    return NextResponse.json({ 
      success: true, 
      imported: importedCount,
      message: `Successfully imported ${importedCount} questions`
    });
  } catch (error) {
    console.error('Error importing questions:', error);
    return NextResponse.json(
      { error: 'Failed to import questions' },
      { status: 500 }
    );
  }
}
