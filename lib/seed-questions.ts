import { query, initializeDatabase } from './db-config';

const sampleQuestions = [
  // General Knowledge
  {
    category: 'general',
    question_text: 'What is the capital of France?',
    choice_a: 'London',
    choice_b: 'Berlin',
    choice_c: 'Paris',
    choice_d: 'Madrid',
    correct_choice: 'C'
  },
  {
    category: 'general',
    question_text: 'Which planet is known as the Red Planet?',
    choice_a: 'Venus',
    choice_b: 'Mars',
    choice_c: 'Jupiter',
    choice_d: 'Saturn',
    correct_choice: 'B'
  },
  {
    category: 'general',
    question_text: 'What is the largest ocean on Earth?',
    choice_a: 'Atlantic Ocean',
    choice_b: 'Indian Ocean',
    choice_c: 'Arctic Ocean',
    choice_d: 'Pacific Ocean',
    correct_choice: 'D'
  },
  
  // Science
  {
    category: 'science',
    question_text: 'What is the chemical symbol for gold?',
    choice_a: 'Go',
    choice_b: 'Au',
    choice_c: 'Ag',
    choice_d: 'Gd',
    correct_choice: 'B'
  },
  {
    category: 'science',
    question_text: 'How many bones are in the adult human body?',
    choice_a: '206',
    choice_b: '208',
    choice_c: '204',
    choice_d: '210',
    correct_choice: 'A'
  },
  {
    category: 'science',
    question_text: 'What gas makes up about 78% of Earth\'s atmosphere?',
    choice_a: 'Oxygen',
    choice_b: 'Carbon Dioxide',
    choice_c: 'Nitrogen',
    choice_d: 'Hydrogen',
    correct_choice: 'C'
  },
  
  // History
  {
    category: 'history',
    question_text: 'In which year did World War II end?',
    choice_a: '1944',
    choice_b: '1945',
    choice_c: '1946',
    choice_d: '1947',
    correct_choice: 'B'
  },
  {
    category: 'history',
    question_text: 'Who was the first person to walk on the moon?',
    choice_a: 'Buzz Aldrin',
    choice_b: 'John Glenn',
    choice_c: 'Neil Armstrong',
    choice_d: 'Alan Shepard',
    correct_choice: 'C'
  },
  {
    category: 'history',
    question_text: 'Which ancient wonder of the world was located in Alexandria?',
    choice_a: 'Hanging Gardens',
    choice_b: 'Lighthouse of Alexandria',
    choice_c: 'Colossus of Rhodes',
    choice_d: 'Temple of Artemis',
    correct_choice: 'B'
  },
  
  // Sports
  {
    category: 'sports',
    question_text: 'How many players are on a basketball team on the court at one time?',
    choice_a: '4',
    choice_b: '5',
    choice_c: '6',
    choice_d: '7',
    correct_choice: 'B'
  },
  {
    category: 'sports',
    question_text: 'In which sport would you perform a slam dunk?',
    choice_a: 'Tennis',
    choice_b: 'Volleyball',
    choice_c: 'Basketball',
    choice_d: 'Baseball',
    correct_choice: 'C'
  },
  {
    category: 'sports',
    question_text: 'How often are the Summer Olympic Games held?',
    choice_a: 'Every 2 years',
    choice_b: 'Every 3 years',
    choice_c: 'Every 4 years',
    choice_d: 'Every 5 years',
    correct_choice: 'C'
  },
  
  // Technology
  {
    category: 'technology',
    question_text: 'What does "HTTP" stand for?',
    choice_a: 'HyperText Transfer Protocol',
    choice_b: 'High Tech Transfer Protocol',
    choice_c: 'HyperText Transport Protocol',
    choice_d: 'High Transfer Text Protocol',
    correct_choice: 'A'
  },
  {
    category: 'technology',
    question_text: 'Which company developed the iPhone?',
    choice_a: 'Samsung',
    choice_b: 'Google',
    choice_c: 'Apple',
    choice_d: 'Microsoft',
    correct_choice: 'C'
  },
  {
    category: 'technology',
    question_text: 'What does "AI" stand for in technology?',
    choice_a: 'Automatic Intelligence',
    choice_b: 'Artificial Intelligence',
    choice_c: 'Advanced Intelligence',
    choice_d: 'Automated Intelligence',
    correct_choice: 'B'
  },
  
  // Entertainment
  {
    category: 'entertainment',
    question_text: 'Which movie won the Academy Award for Best Picture in 2020?',
    choice_a: 'Joker',
    choice_b: 'Parasite',
    choice_c: '1917',
    choice_d: 'Once Upon a Time in Hollywood',
    correct_choice: 'B'
  },
  {
    category: 'entertainment',
    question_text: 'Who directed the movie "Jaws"?',
    choice_a: 'George Lucas',
    choice_b: 'Steven Spielberg',
    choice_c: 'Martin Scorsese',
    choice_d: 'Francis Ford Coppola',
    correct_choice: 'B'
  },
  {
    category: 'entertainment',
    question_text: 'Which streaming service produced "Stranger Things"?',
    choice_a: 'Hulu',
    choice_b: 'Amazon Prime',
    choice_c: 'Netflix',
    choice_d: 'Disney+',
    correct_choice: 'C'
  },
  
  // Geography
  {
    category: 'geography',
    question_text: 'Which is the longest river in the world?',
    choice_a: 'Amazon River',
    choice_b: 'Nile River',
    choice_c: 'Mississippi River',
    choice_d: 'Yangtze River',
    correct_choice: 'B'
  },
  {
    category: 'geography',
    question_text: 'Mount Everest is located in which mountain range?',
    choice_a: 'Andes',
    choice_b: 'Rocky Mountains',
    choice_c: 'Alps',
    choice_d: 'Himalayas',
    correct_choice: 'D'
  },
  {
    category: 'geography',
    question_text: 'Which country has the most time zones?',
    choice_a: 'United States',
    choice_b: 'Russia',
    choice_c: 'China',
    choice_d: 'Canada',
    correct_choice: 'B'
  },
  
  // Literature
  {
    category: 'literature',
    question_text: 'Who wrote "To Kill a Mockingbird"?',
    choice_a: 'Harper Lee',
    choice_b: 'Mark Twain',
    choice_c: 'Ernest Hemingway',
    choice_d: 'F. Scott Fitzgerald',
    correct_choice: 'A'
  },
  {
    category: 'literature',
    question_text: 'In which Shakespeare play does the character Hamlet appear?',
    choice_a: 'Macbeth',
    choice_b: 'Romeo and Juliet',
    choice_c: 'Hamlet',
    choice_d: 'Othello',
    correct_choice: 'C'
  },
  {
    category: 'literature',
    question_text: 'Who wrote the "Harry Potter" series?',
    choice_a: 'J.R.R. Tolkien',
    choice_b: 'C.S. Lewis',
    choice_c: 'J.K. Rowling',
    choice_d: 'Roald Dahl',
    correct_choice: 'C'
  }
];

export async function seedQuestions(): Promise<void> {
  try {
    console.log('Seeding questions...');
    
    // Initialize database tables first
    console.log('Initializing database tables...');
    await initializeDatabase();
    
    // Clear existing questions (optional)
    await query('DELETE FROM questions');
    
    // Insert sample questions
    for (const question of sampleQuestions) {
      await query(
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
    }
    
    console.log(`Successfully seeded ${sampleQuestions.length} questions`);
  } catch (error) {
    console.error('Error seeding questions:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedQuestions()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
