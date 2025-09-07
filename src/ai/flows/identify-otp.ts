'use server';

/**
 * @fileOverview This file contains a Genkit flow for identifying OTP messages from known senders and classifying them as Ham.
 *
 * It exports:
 * - `identifyOTP`: An async function that takes a message as input and returns a boolean indicating whether it's an OTP from a known sender.
 * - `IdentifyOTPInput`: The input type for the identifyOTP function.
 * - `IdentifyOTPOutput`: The output type for the identifyOTP function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyOTPInputSchema = z.object({
  message: z.string().describe('The content of the SMS or email message.'),
  sender: z.string().describe('The sender of the message (e.g., phone number or email address).'),
});
export type IdentifyOTPInput = z.infer<typeof IdentifyOTPInputSchema>;

const IdentifyOTPOutputSchema = z.object({
  isOTP: z.boolean().describe('True if the message is an OTP from a known sender, false otherwise.'),
});
export type IdentifyOTPOutput = z.infer<typeof IdentifyOTPOutputSchema>;

export async function identifyOTP(input: IdentifyOTPInput): Promise<IdentifyOTPOutput> {
  return identifyOTPFlow(input);
}

const knownOTPSenderPrompt = ai.definePrompt({
    name: 'knownOTPSenderPrompt',
    input: { schema: IdentifyOTPInputSchema },
    output: { schema: IdentifyOTPOutputSchema },
    prompt: `You are an expert system designed to classify SMS messages to determine whether they are One-Time Passwords (OTP) from known and trusted senders.

    Analyze the following message and sender information to determine if the message is an OTP from a known sender.

    Message: {{{message}}}
    Sender: {{{sender}}}

    Consider these guidelines:
    - OTP messages often contain phrases like "is your OTP", "One Time Password", or similar.
    - OTPs are usually numeric or alphanumeric codes.
    - Known senders are typically banks, payment services, or other services that require secure authentication.

    Based on the above information, determine whether the message is an OTP from a known sender. Return true if it is, false otherwise.
`,
  });

const identifyOTPFlow = ai.defineFlow(
  {
    name: 'identifyOTPFlow',
    inputSchema: IdentifyOTPInputSchema,
    outputSchema: IdentifyOTPOutputSchema,
  },
  async input => {
    const {output} = await knownOTPSenderPrompt(input);
    return output!;
  }
);
