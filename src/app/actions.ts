'use server';

import { analyzeKeywords } from '@/ai/flows/analyze-keywords';
import { authenticateBankMessage } from '@/ai/flows/authenticate-bank-messages';
import { detectLinks } from '@/ai/flows/detect-links';
import { detectMixedCharacters } from '@/ai/flows/detect-mixed-characters';
import { detectMoneyRelatedTerms } from '@/ai/flows/detect-money-related-terms';
import { detectPremiumRateNumbers } from '@/ai/flows/detect-premium-rate-numbers';
import { detectUrgency } from '@/ai/flows/detect-urgency';
import { identifyOTP } from '@/ai/flows/identify-otp';
import { isKnownContact } from '@/ai/flows/is-known-contact';

type ClassificationResult = {
  classification: 'Spam' | 'Ham';
  reason: string;
  confidence: number;
};

export async function classifyMessage(
  sender: string,
  message: string
): Promise<ClassificationResult> {
  const reasons: string[] = [];
  let hamScore = 0;
  let spamScore = 0;

  // Rule 1: OTP Messages from Known Senders → Classified as Ham.
  const otpResult = await identifyOTP({ sender, message });
  if (otpResult.isOTP) {
    return {
      classification: 'Ham',
      reason: 'Identified as a One-Time Password (OTP).',
      confidence: 100,
    };
  }

  // Rule 2: Messages from Authenticated Banks → Classified as Ham.
  const bankResult = await authenticateBankMessage({ sender, messageText: message });
  if (bankResult.isHam) {
    return {
      classification: 'Ham',
      reason: 'Message from an authenticated bank.',
      confidence: 100,
    };
  }
  
  // Rule: Check if sender is a known contact.
  const knownContactResult = await isKnownContact({ sender });
  if (knownContactResult.isKnown) {
    reasons.push('Sender is a known contact.');
    hamScore += 40;
  } else {
    reasons.push('Sender is unknown.');
    spamScore += 10;
  }

  // Spam checks
  const mixedCharsResult = await detectMixedCharacters({ message });
  if (mixedCharsResult.containsMixedCharacters) {
    reasons.push('Contains words with mixed letters and numbers (leetspeak).');
    spamScore += 30;
  }

  const linksResult = await detectLinks({ message });
  if (linksResult.containsLink) {
    reasons.push('Contains a URL/link.');
    spamScore += 20;
  }
  
  const moneyTermsResult = await detectMoneyRelatedTerms({ message });
  if (moneyTermsResult.containsMoneyTerms) {
    reasons.push('Contains money-related terms.');
    spamScore += 20;
  }
  
  const premiumNumberResult = await detectPremiumRateNumbers({ message });
  if (premiumNumberResult.containsPremiumRateNumber) {
    reasons.push('Contains a premium-rate number.');
    spamScore += 40;
  }
  
  const urgencyResult = await detectUrgency({ message });
  if (urgencyResult.containsUrgency) {
    reasons.push('Contains urgent language.');
    spamScore += 20;
  }

  const keywordResult = await analyzeKeywords({ message });
  if (keywordResult.isSpam) {
    reasons.push(keywordResult.reason || 'Contains spam-related keywords.');
    spamScore += 25;
  }

  const totalScore = hamScore + spamScore;
  if (totalScore === 0) {
    // Default case if no specific rules match
    return {
      classification: 'Ham',
      reason: 'Does not meet any specific spam criteria.',
      confidence: 95,
    };
  }

  if (spamScore > hamScore) {
    const confidence = Math.min(99, Math.round((spamScore / totalScore) * 100) + 20);
    return {
      classification: 'Spam',
      reason: reasons.join(' '),
      confidence: Math.min(99, confidence),
    };
  } else {
    const confidence = Math.min(99, Math.round((hamScore / totalScore) * 100) + 20);
    return {
      classification: 'Ham',
      reason: reasons.join(' ') || 'Does not meet spam criteria.',
      confidence: Math.min(99, confidence),
    };
  }
}
