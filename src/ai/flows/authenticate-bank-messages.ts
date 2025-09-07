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

// A list of known, authenticated bank senders.
// In a real application, this would be a database or a more robust service.
const AUTHENTICATED_BANKS = ['BANK-SBI', 'HDFCBANK', 'ICICI-BANK', 'AxisBank'];


const isAuthenticatedBank = ai.defineTool(
  {
    name: 'isAuthenticatedBank',
    description: 'Checks if the sender is an authenticated bank based on a known list.',
    inputSchema: z.object({
      sender: z.string().describe('The sender of the message.'),
    }),
    outputSchema: z.boolean(),
  },
  async input => {
    // Check if the sender is in our list of authenticated banks.
    const isAuth = AUTHENTICATED_BANKS.includes(input.sender.toUpperCase());
    console.log(`Checking if ${input.sender} is an authenticated bank: ${isAuth}`);
    return isAuth;
  }
);

const authenticateBankMessagePrompt = ai.definePrompt({
  name: 'authenticateBankMessagePrompt',
  tools: [isAuthenticatedBank],
  input: {schema: AuthenticateBankMessageInputSchema},
  output: {schema: AuthenticateBankMessageOutputSchema},
  prompt: `If the sender '{{sender}}' is an authenticated bank, classify the message as Ham. Use the isAuthenticatedBank tool to verify the sender.

Message Text: {{messageText}}`,
});

const authenticateBankMessageFlow = ai.defineFlow(
  {
    name: 'authenticateBankMessageFlow',
    inputSchema: AuthenticateBankMessageInputSchema,
    outputSchema: AuthenticateBankMessageOutputSchema,
  },
  async input => {
    // We only need to run this check if the sender might be a bank.
    // Let's check against our list first before calling the AI.
    if (AUTHENTICATED_BANKS.some(bank => input.sender.toUpperCase().includes(bank))) {
        const result = await isAuthenticatedBank(input);
        return { isHam: result };
    }
    
    // If the sender is not in the list, no need to call the AI with the tool.
    // It's not a bank message we can authenticate this way.
    return { isHam: false };
  }
);

export async function authenticateBankMessage(
  input: AuthenticateBankMessageInput
): Promise<AuthenticateBankMessageOutput> {
  return authenticateBankMessageFlow(input);
}
