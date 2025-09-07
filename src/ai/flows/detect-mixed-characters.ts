'use server';

/**
 * @fileOverview A flow to detect messages containing words with mixed letters and numbers and classify them as Spam.
 *
 * - detectMixedCharacters - A function that handles the detection of mixed characters in a message.
 * - DetectMixedCharactersInput - The input type for the detectMixedCharacters function.
 * - DetectMixedCharactersOutput - The return type for the detectMixedCharacters function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectMixedCharactersInputSchema = z.object({
  message: z.string().describe('The SMS/email message to be checked.'),
});
export type DetectMixedCharactersInput = z.infer<typeof DetectMixedCharactersInputSchema>;

const DetectMixedCharactersOutputSchema = z.object({
  containsMixedCharacters: z
    .boolean()
    .describe('Whether the message contains words with mixed letters and numbers.'),
});
export type DetectMixedCharactersOutput = z.infer<typeof DetectMixedCharactersOutputSchema>;

export async function detectMixedCharacters(
  input: DetectMixedCharactersInput
): Promise<DetectMixedCharactersOutput> {
  return detectMixedCharactersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectMixedCharactersPrompt',
  input: {schema: DetectMixedCharactersInputSchema},
  output: {schema: DetectMixedCharactersOutputSchema},
  prompt: `You are an expert spam detector. Your job is to analyze SMS/email messages and determine if they contain words with mixed letters and numbers (e.g., congratulat1ons, fr33, cl1ck).

  Here is the message to analyze:
  {{message}}

  Respond with whether or not it contains mixed characters.
  `,
});

const detectMixedCharactersFlow = ai.defineFlow(
  {
    name: 'detectMixedCharactersFlow',
    inputSchema: DetectMixedCharactersInputSchema,
    outputSchema: DetectMixedCharactersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
