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
  const isKnown = KNOWN_CONTACTS.includes(input.sender.toLowerCase());
  return { isKnown };
}
