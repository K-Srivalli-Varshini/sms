'use server';

/**
 * @fileOverview A flow to check if a sender is a known contact.
 *
 * - isKnownContact - A function that checks if a sender is a known contact.
 * - IsKnownContactInput - The input type for the isKnownContact function.
 * - IsKnownContactOutput - The return type for the isKnownContact function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// In a real application, this would be a database of contacts.
const KNOWN_CONTACTS = ['+11234567890', 'mom', 'dad', 'friend@example.com'];


const IsKnownContactInputSchema = z.object({
  sender: z.string().describe('The sender of the message (phone number or email).'),
});
export type IsKnownContactInput = z.infer<typeof IsKnownContactInputSchema>;

const IsKnownContactOutputSchema = z.object({
  isKnown: z.boolean().describe('Whether the sender is a known contact.'),
});
export type IsKnownContactOutput = z.infer<typeof IsKnownContactOutputSchema>;

export async function isKnownContact(input: IsKnownContactInput): Promise<IsKnownContactOutput> {
  return isKnownContactFlow(input);
}

const isKnownContactTool = ai.defineTool({
    name: 'isKnownContactTool',
    description: 'Checks if a sender is in the list of known contacts.',
    inputSchema: IsKnownContactInputSchema,
    outputSchema: IsKnownContactOutputSchema,
}, async ({ sender }) => {
    return { isKnown: KNOWN_CONTACTS.includes(sender.toLowerCase()) };
});


const prompt = ai.definePrompt({
  name: 'isKnownContactPrompt',
  tools: [isKnownContactTool],
  input: {schema: IsKnownContactInputSchema},
  output: {schema: IsKnownContactOutputSchema},
  prompt: `Check if the sender '{{sender}}' is a known contact using the provided tool.`,
});

const isKnownContactFlow = ai.defineFlow(
  {
    name: 'isKnownContactFlow',
    inputSchema: IsKnownContactInputSchema,
    outputSchema: IsKnownContactOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
