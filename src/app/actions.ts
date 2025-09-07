'use server';

import { analyzeKeywords } from '@/ai/flows/analyze-keywords';
import { authenticateBankMessage } from '@/ai/flows/authenticate-bank-messages';
import { detectLinks } from '@/ai/flows/detect-links';
import { detectMixedCharacters } from '@/ai/flows/detect-mixed-characters';
import { identifyOTP } from '@/ai/flows/identify-otp';

type ClassificationResult = {
  classification: 'Spam' | 'Ham';
  reason: string;
};

export async function classifyMessage(
  sender: string,
  message: string
): Promise<ClassificationResult> {
  // Rule 1: OTP Messages from Known Senders → Classified as Ham.
  const otpResult = await identifyOTP({ sender, message });
  if (otpResult.isOTP) {
    return {
      classification: 'Ham',
      reason: 'Identified as a One-Time Password (OTP).',
    };
  }

  // Rule 2: Messages from Authenticated Banks → Classified as Ham.
  const bankResult = await authenticateBankMessage({ sender, messageText: message });
  if (bankResult.isHam) {
    return {
      classification: 'Ham',
      reason: 'Message from an authenticated bank.',
    };
  }

  // Rule 3: Words with mixed letters and numbers → Classified as Spam.
  const mixedCharsResult = await detectMixedCharacters({ message });
  if (mixedCharsResult.containsMixedCharacters) {
    return {
      classification: 'Spam',
      reason: 'Contains words with mixed letters and numbers.',
    };
  }

  // Rule 4: Messages containing any links/URLs → Classified as Spam.
  const linksResult = await detectLinks({ message });
  if (linksResult.containsLink) {
    return { classification: 'Spam', reason: 'Contains a URL/link.' };
  }

  // Rule 5: Otherwise: Use basic keyword rules
  const keywordResult = await analyzeKeywords({ message });
  if (keywordResult.isSpam) {
    return {
      classification: 'Spam',
      reason: keywordResult.reason || 'Contains spam-related keywords.',
    };
  }

  // Default to Ham if no spam rules are met
  return {
    classification: 'Ham',
    reason: 'Does not meet any spam criteria.',
  };
}
