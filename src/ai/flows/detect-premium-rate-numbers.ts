'use server';

/**
 * @fileOverview A flow to detect messages containing premium-rate numbers.
 *
 * - detectPremiumRateNumbers - A function that handles the detection of premium-rate numbers in a message.
 * - DetectPremiumRateNumbersInput - The input type for the detectPremiumRateNumbers function.
 * - DetectPremiumRateNumbersOutput - The return type for the detectPremiumRateNumbers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectPremiumRateNumbersInputSchema = z.object({
  message: z.string().describe('The SMS/email message to be checked.'),
});
export type DetectPremiumRateNumbersInput = z.infer<typeof DetectPremiumRateNumbersInputSchema>;

const DetectPremiumRateNumbersOutputSchema = z.object({
  containsPremiumRateNumber: z
    .boolean()
    .describe('Whether the message contains a premium-rate number.'),
});
export type DetectPremiumRateNumbersOutput = z.infer<typeof DetectPremiumRateNumbersOutputSchema>;

export async function detectPremiumRateNumbers(
  input: DetectPremiumRateNumbersInput
): Promise<DetectPremiumRateNumbersOutput> {
  return detectPremiumRateNumbersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectPremiumRateNumbersPrompt',
  input: {schema: DetectPremiumRateNumbersInputSchema},
  output: {schema: DetectPremiumRateNumbersOutputSchema},
  prompt: `You are an expert spam detector. Your job is to analyze SMS/email messages and determine if they contain any premium-rate numbers (e.g., numbers starting with '900', '976', or short codes that require payment).

  Here is the message to analyze:
  {{message}}

  Respond with whether or not it contains a premium-rate number.
  `,
});

const detectPremiumRateNumbersFlow = ai.defineFlow(
  {
    name: 'detectPremiumRateNumbersFlow',
    inputSchema: DetectPremiumRateNumbersInputSchema,
    outputSchema: DetectPremiumRateNumbersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
