'use server';

/**
 * @fileOverview A flow to detect messages containing money-related terms.
 *
 * - detectMoneyRelatedTerms - A function that detects money-related terms in a message.
 * - DetectMoneyRelatedTermsInput - The input type for the detectMoneyRelatedTerms function.
 * - DetectMoneyRelatedTermsOutput - The return type for the detectMoneyRelatedTerms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectMoneyRelatedTermsInputSchema = z.object({
  message: z.string().describe('The SMS/email message to be checked.'),
});
export type DetectMoneyRelatedTermsInput = z.infer<typeof DetectMoneyRelatedTermsInputSchema>;

const DetectMoneyRelatedTermsOutputSchema = z.object({
  containsMoneyTerms: z
    .boolean()
    .describe('Whether the message contains money-related terms.'),
});
export type DetectMoneyRelatedTermsOutput = z.infer<typeof DetectMoneyRelatedTermsOutputSchema>;

export async function detectMoneyRelatedTerms(
  input: DetectMoneyRelatedTermsInput
): Promise<DetectMoneyRelatedTermsOutput> {
  return detectMoneyRelatedTermsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectMoneyRelatedTermsPrompt',
  input: {schema: DetectMoneyRelatedTermsInputSchema},
  output: {schema: DetectMoneyRelatedTermsOutputSchema},
  prompt: `You are an expert spam detector. Your job is to analyze SMS/email messages and determine if they contain any terms related to money, winning prizes, or financial transactions (e.g., "cash", "prize", "won", "payment", "invoice").

  Here is the message to analyze:
  {{message}}

  Respond with whether or not it contains money-related terms.
  `,
});

const detectMoneyRelatedTermsFlow = ai.defineFlow(
  {
    name: 'detectMoneyRelatedTermsFlow',
    inputSchema: DetectMoneyRelatedTermsInputSchema,
    outputSchema: DetectMoneyRelatedTermsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
