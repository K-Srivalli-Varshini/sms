// This file uses server-side code.
'use server';

/**
 * @fileOverview Detects URLs/links in a message and classifies it as Spam.
 *
 * - detectLinks - A function to detect links in a message.
 * - DetectLinksInput - The input type for the detectLinks function.
 * - DetectLinksOutput - The return type for the detectLinks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectLinksInputSchema = z.object({
  message: z.string().describe('The SMS/email message to analyze.'),
});
export type DetectLinksInput = z.infer<typeof DetectLinksInputSchema>;

const DetectLinksOutputSchema = z.object({
  containsLink: z.boolean().describe('Whether the message contains a link.'),
});
export type DetectLinksOutput = z.infer<typeof DetectLinksOutputSchema>;

export async function detectLinks(input: DetectLinksInput): Promise<DetectLinksOutput> {
  return detectLinksFlow(input);
}

const detectLinksPrompt = ai.definePrompt({
  name: 'detectLinksPrompt',
  input: {schema: DetectLinksInputSchema},
  output: {schema: DetectLinksOutputSchema},
  prompt: `You are an expert spam detector.
  Your job is to analyze the input message and detect any URLs or links.

  Message: {{{message}}}

  Respond with whether the message contains a link or not.
  `,
});

const detectLinksFlow = ai.defineFlow(
  {
    name: 'detectLinksFlow',
    inputSchema: DetectLinksInputSchema,
    outputSchema: DetectLinksOutputSchema,
  },
  async input => {
    const {output} = await detectLinksPrompt(input);
    return output!;
  }
);
