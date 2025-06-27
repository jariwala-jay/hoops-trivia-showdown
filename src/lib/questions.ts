import { Question } from '@/types';

export const TRIVIA_QUESTIONS: Question[] = [
  {
    id: '1',
    question: 'Who holds the record for most points scored in a single NBA game?',
    options: ['Michael Jordan', 'Kobe Bryant', 'Wilt Chamberlain', 'Kareem Abdul-Jabbar'],
    correctAnswer: 2,
    timeLimit: 24
  },
  {
    id: '2', 
    question: 'Which team has won the most NBA championships?',
    options: ['Boston Celtics', 'Los Angeles Lakers', 'Chicago Bulls', 'Golden State Warriors'],
    correctAnswer: 0,
    timeLimit: 24
  },
  {
    id: '3',
    question: 'Who was the first player to be unanimously voted NBA MVP?',
    options: ['LeBron James', 'Michael Jordan', 'Stephen Curry', 'Shaquille O\'Neal'],
    correctAnswer: 2,
    timeLimit: 24
  },
  {
    id: '4',
    question: 'What year was the NBA founded?',
    options: ['1946', '1949', '1951', '1953'],
    correctAnswer: 0,
    timeLimit: 24
  },
  {
    id: '5',
    question: 'Which player has the most career assists in NBA history?',
    options: ['Magic Johnson', 'John Stockton', 'Chris Paul', 'Steve Nash'],
    correctAnswer: 1,
    timeLimit: 24
  },
  {
    id: '6',
    question: 'What is the diameter of a basketball hoop?',
    options: ['16 inches', '17 inches', '18 inches', '19 inches'],
    correctAnswer: 2,
    timeLimit: 24
  },
  {
    id: '7',
    question: 'Which team drafted Kobe Bryant?',
    options: ['Los Angeles Lakers', 'Charlotte Hornets', 'Philadelphia 76ers', 'Boston Celtics'],
    correctAnswer: 1,
    timeLimit: 24
  },
  {
    id: '8',
    question: 'How many games are in a regular NBA season?',
    options: ['80', '82', '84', '86'],
    correctAnswer: 1,
    timeLimit: 24
  },
  {
    id: '9',
    question: 'Who was known as "The Big Fundamental"?',
    options: ['Shaquille O\'Neal', 'Tim Duncan', 'David Robinson', 'Hakeem Olajuwon'],
    correctAnswer: 1,
    timeLimit: 24
  },
  {
    id: '10',
    question: 'Which player holds the record for most 3-pointers made in NBA history?',
    options: ['Ray Allen', 'Reggie Miller', 'Stephen Curry', 'Kyle Korver'],
    correctAnswer: 2,
    timeLimit: 24
  }
];

export function getRandomQuestions(count: number = 5): Question[] {
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
} 