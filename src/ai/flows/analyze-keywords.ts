// src/ai/flows/analyze-keywords.ts
'use server';
/**
 * @fileOverview A flow to classify messages based on the presence of spam keywords.
 *
 * - analyzeKeywords - A function that classifies a message as spam or ham based on keywords.
 * - AnalyzeKeywordsInput - The input type for the analyzeKeywords function.
 * - AnalyzeKeywordsOutput - The return type for the analyzeKeywords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeKeywordsInputSchema = z.object({
  message: z.string().describe('The message to analyze.'),
});
export type AnalyzeKeywordsInput = z.infer<typeof AnalyzeKeywordsInputSchema>;

const AnalyzeKeywordsOutputSchema = z.object({
  isSpam: z.boolean().describe('Whether the message is classified as spam.'),
  reason: z.string().optional().describe('The reason for the spam classification, if any.'),
});
export type AnalyzeKeywordsOutput = z.infer<typeof AnalyzeKeywordsOutputSchema>;

export async function analyzeKeywords(input: AnalyzeKeywordsInput): Promise<AnalyzeKeywordsOutput> {
  return analyzeKeywordsFlow(input);
}

const analyzeKeywordsPrompt = ai.definePrompt({
  name: 'analyzeKeywordsPrompt',
  input: {schema: AnalyzeKeywordsInputSchema},
  output: {schema: AnalyzeKeywordsOutputSchema},
  prompt: `You are an AI assistant designed to classify SMS messages as spam or ham based on keywords.

  If the message contains any of the following keywords, classify it as spam:
  - free
  - lottery
  - win
  - buy now
  - click here

  Otherwise, classify the message as ham.

  Message: {{{message}}}

  Return a JSON object with the isSpam boolean and, if isSpam is true, provide a reason for the classification.
  `,
});

const analyzeKeywordsFlow = ai.defineFlow(
  {
    name: 'analyzeKeywordsFlow',
    inputSchema: AnalyzeKeywordsInputSchema,
    outputSchema: AnalyzeKeywordsOutputSchema,
  },
  async input => {
    const {output} = await analyzeKeywordsPrompt(input);
    return output!;
  }
);
