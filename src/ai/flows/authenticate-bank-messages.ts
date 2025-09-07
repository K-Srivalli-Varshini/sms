'use server';

/**
 * @fileOverview This file defines a Genkit flow to authenticate bank messages and classify them as Ham.
 *
 * The flow uses a tool to check if the sender is an authenticated bank.
 * It exports:
 * - `authenticateBankMessage`: The main function to classify bank messages.
 * - `AuthenticateBankMessageInput`: The input type for the function.
 * - `AuthenticateBankMessageOutput`: The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AuthenticateBankMessageInputSchema = z.object({
  messageText: z.string().describe('The text content of the SMS/email message.'),
  sender: z.string().describe('The sender of the SMS/email message.'),
});
export type AuthenticateBankMessageInput = z.infer<
  typeof AuthenticateBankMessageInputSchema
>;

const AuthenticateBankMessageOutputSchema = z.object({
  isHam: z.boolean().describe('True if the message is from an authenticated bank, false otherwise.'),
});
export type AuthenticateBankMessageOutput = z.infer<
  typeof AuthenticateBankMessageOutputSchema
>;

const isAuthenticatedBank = ai.defineTool(
  {
    name: 'isAuthenticatedBank',
    description: 'Checks if the sender is an authenticated bank.',
    inputSchema: z.object({
      sender: z.string().describe('The sender of the message.'),
    }),
    outputSchema: z.boolean(),
  },
  async input => {
    // Here, you would implement the logic to check if the sender is an
    // authenticated bank. This could involve querying a database of known
    // authenticated banks, or using some other method to verify the sender.
    // For this example, we'll just return `true` to simulate a successful
    // authentication.
    // TODO: Implement the actual bank authentication logic here.
    console.log(`Checking if ${input.sender} is an authenticated bank.`);
    return true;
  }
);

const authenticateBankMessagePrompt = ai.definePrompt({
  name: 'authenticateBankMessagePrompt',
  tools: [isAuthenticatedBank],
  input: {schema: AuthenticateBankMessageInputSchema},
  output: {schema: AuthenticateBankMessageOutputSchema},
  prompt: `Determine if the following message from {{sender}} is from an authenticated bank. Use the isAuthenticatedBank tool to check.

Message Text: {{messageText}}`,
});

const authenticateBankMessageFlow = ai.defineFlow(
  {
    name: 'authenticateBankMessageFlow',
    inputSchema: AuthenticateBankMessageInputSchema,
    outputSchema: AuthenticateBankMessageOutputSchema,
  },
  async input => {
    const {output} = await authenticateBankMessagePrompt(input);
    return output!;
  }
);

export async function authenticateBankMessage(
  input: AuthenticateBankMessageInput
): Promise<AuthenticateBankMessageOutput> {
  return authenticateBankMessageFlow(input);
}

