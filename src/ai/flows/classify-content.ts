'use server';
/**
 * @fileOverview A flow to classify messages based on multiple content criteria.
 *
 * - classifyContent - A function that classifies a message based on several spam-related content checks.
 * - ClassifyContentInput - The input type for the classifyContent function.
 * - ClassifyContentOutput - The return type for the classifyContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyContentInputSchema = z.object({
  message: z.string().describe('The SMS/email message to analyze.'),
});
export type ClassifyContentInput = z.infer<typeof ClassifyContentInputSchema>;

const ClassifyContentOutputSchema = z.object({
    containsMixedCharacters: z.boolean().describe('Does the message contain words with mixed letters and numbers (e.g., congratulat1ons, fr33, cl1ck)?'),
    containsLink: z.boolean().describe('Does the message contain a URL or link?'),
    containsMoneyTerms: z.boolean().describe('Does the message contain any terms related to money, winning prizes, or financial transactions (e.g., "cash", "prize", "won", "payment", "invoice")?'),
    containsPremiumRateNumber: z.boolean().describe("Does the message contain any premium-rate numbers (e.g., numbers starting with '900', '976', or short codes that require payment)?"),
    containsUrgency: z.boolean().describe('Does the message contain urgent or time-sensitive language (e.g., "act now", "limited time", "urgent", "immediate action required")?'),
    containsSpamKeywords: z.boolean().describe("Does the message contain any of the following keywords: 'free', 'lottery', 'win', 'buy now', 'click here'?"),
});
export type ClassifyContentOutput = z.infer<typeof ClassifyContentOutputSchema>;


const classifyContentPrompt = ai.definePrompt({
    name: 'classifyContentPrompt',
    input: {schema: ClassifyContentInputSchema},
    output: {schema: ClassifyContentOutputSchema},
    prompt: `You are an expert spam detector. Your job is to analyze the input message and evaluate it against several criteria.

Message: {{{message}}}

Please evaluate the message and respond with a JSON object indicating whether the following are true or false.`,
});

const classifyContentFlow = ai.defineFlow({
    name: 'classifyContentFlow',
    inputSchema: ClassifyContentInputSchema,
    outputSchema: ClassifyContentOutputSchema,
}, async (input) => {
    const {output} = await classifyContentPrompt(input);
    return output!;
});

export async function classifyContent(input: ClassifyContentInput): Promise<ClassifyContentOutput> {
  return classifyContentFlow(input);
}
