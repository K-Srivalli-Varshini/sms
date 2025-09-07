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


export async function authenticateBankMessage(
  input: AuthenticateBankMessageInput
): Promise<AuthenticateBankMessageOutput> {
  const isAuth = AUTHENTICATED_BANKS.some(bank => input.sender.toUpperCase().includes(bank));
  return { isHam: isAuth };
}
