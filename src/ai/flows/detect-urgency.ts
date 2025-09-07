'use server';

/**
 * @fileOverview A flow to detect messages containing urgent language.
 *
 * - detectUrgency - A function that handles the detection of urgent language in a message.
 * - DetectUrgencyInput - The input type for the detectUrgency function.
 * - DetectUrgencyOutput - The return type for the detectUrgency function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectUrgencyInputSchema = z.object({
  message: z.string().describe('The SMS/email message to be checked.'),
});
export type DetectUrgencyInput = z.infer<typeof DetectUrgencyInputSchema>;

const DetectUrgencyOutputSchema = z.object({
  containsUrgency: z
    .boolean()
    .describe('Whether the message contains urgent language.'),
});
export type DetectUrgencyOutput = z.infer<typeof DetectUrgencyOutputSchema>;

export async function detectUrgency(
  input: DetectUrgencyInput
): Promise<DetectUrgencyOutput> {
  return detectUrgencyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectUrgencyPrompt',
  input: {schema: DetectUrgencyInputSchema},
  output: {schema: DetectUrgencyOutputSchema},
  prompt: `You are an expert spam detector. Your job is to analyze SMS/email messages and determine if they contain urgent or time-sensitive language (e.g., "act now", "limited time", "urgent", "immediate action required").

  Here is the message to analyze:
  {{message}}

  Respond with whether or not it contains urgent language.
  `,
});

const detectUrgencyFlow = ai.defineFlow(
  {
    name: 'detectUrgencyFlow',
    inputSchema: DetectUrgencyInputSchema,
    outputSchema: DetectUrgencyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
