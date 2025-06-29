import OpenAI from 'openai';
import { Question } from '@/types';

// Ensure the OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates trivia questions using the OpenAI API.
 * @param topic The topic for the questions (e.g., "NBA History").
 * @param difficulty The difficulty level ("Easy", "Medium", or "Hard").
 * @param count The number of questions to generate.
 * @returns A promise that resolves to an array of Question objects.
 */
export async function generateTriviaQuestions(
  topic: string,
  difficulty: string,
  count: number = 5
): Promise<Question[]> {
  const prompt = `
    You are an expert trivia game designer. Your task is to generate ${count} unique, high-quality trivia questions about ${topic}.
    The difficulty level for these questions should be ${difficulty}.

    Please provide the output in a clean, valid JSON format. The response must be a single JSON object with a key named "questions".
    The value of the "questions" key should be an array of ${count} question objects.

    Each object in the "questions" array must have the following structure:
    - id: A unique string identifier for the question (e.g., "nba-easy-1").
    - question: The full text of the question.
    - options: An array of 4 strings representing the multiple-choice answers.
    - correctAnswer: The index (0-3) of the correct answer in the 'options' array.
    - timeLimit: The time limit in seconds to answer, which should always be 24.

    Example format:
    {
      "questions": [
        {
          "id": "nba-med-123",
          "question": "Which player was known as 'The Mailman'?",
          "options": ["Karl Malone", "John Stockton", "Scottie Pippen", "Charles Barkley"],
          "correctAnswer": 0,
          "timeLimit": 24
        }
      ]
    }

    Do not include any extra text, explanations, or markdown formatting outside of the JSON object itself.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Or another suitable model like 'gpt-3.5-turbo'
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8, // A little creativity is good
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response.');
    }

    // For debugging: log the raw response from the AI
    console.log("--- Raw OpenAI Response ---");
    console.log(content);
    console.log("---------------------------");

    const parsedJson = JSON.parse(content);
    
    // We now expect a specific structure: { questions: [...] }
    const questionsArray = parsedJson.questions;

    if (!Array.isArray(questionsArray)) {
        throw new Error('The "questions" array was not found in the OpenAI response.');
    }

    // Basic validation to ensure the data structure is correct
    if (questionsArray.length > 0 && questionsArray.some(q => !q.question || !q.options || q.correctAnswer === undefined)) {
      throw new Error('OpenAI response is missing required fields in one or more question objects.');
    }

    return questionsArray as Question[];
  } catch (error) {
    console.error('Error generating trivia questions from OpenAI:', error);
    // In case of an error, return an empty array or re-throw
    throw new Error(`Failed to generate questions from AI service. OpenAI error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
} 