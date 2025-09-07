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

// Define weights for each rule
const weights = {
  isKnownContact: 50,
  isUnknownContact: 10,
  containsMixedCharacters: 30,
  containsLink: 20,
  containsMoneyTerms: 20,
  containsPremiumRateNumber: 40,
  containsUrgency: 20,
  containsSpamKeywords: 25,
};

const SPAM_THRESHOLD = 50;

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

  const reasons: string[] = [];
  let score = 0;
  const triggeredRules: (keyof typeof weights)[] = [];

  // Rule: Check if sender is a known contact.
  const knownContactResult = await isKnownContact({ sender });
  if (knownContactResult.isKnown) {
    reasons.push('Sender is a known contact.');
    score -= weights.isKnownContact; // Negative score for ham indicator
  } else {
    reasons.push('Sender is unknown.');
    score += weights.isUnknownContact;
    triggeredRules.push('isUnknownContact');
  }

  // Spam checks
  const mixedCharsResult = await detectMixedCharacters({ message });
  if (mixedCharsResult.containsMixedCharacters) {
    reasons.push('Contains words with mixed letters and numbers (leetspeak).');
    score += weights.containsMixedCharacters;
    triggeredRules.push('containsMixedCharacters');
  }

  const linksResult = await detectLinks({ message });
  if (linksResult.containsLink) {
    reasons.push('Contains a URL/link.');
    score += weights.containsLink;
    triggeredRules.push('containsLink');
  }
  
  const moneyTermsResult = await detectMoneyRelatedTerms({ message });
  if (moneyTermsResult.containsMoneyTerms) {
    reasons.push('Contains money-related terms.');
    score += weights.containsMoneyTerms;
    triggeredRules.push('containsMoneyTerms');
  }
  
  const premiumNumberResult = await detectPremiumRateNumbers({ message });
  if (premiumNumberResult.containsPremiumRateNumber) {
    reasons.push('Contains a premium-rate number.');
    score += weights.containsPremiumRateNumber;
    triggeredRules.push('containsPremiumRateNumber');
  }
  
  const urgencyResult = await detectUrgency({ message });
  if (urgencyResult.containsUrgency) {
    reasons.push('Contains urgent language.');
    score += weights.containsUrgency;
    triggeredRules.push('containsUrgency');
  }

  const keywordResult = await analyzeKeywords({ message });
  if (keywordResult.isSpam) {
    reasons.push(keywordResult.reason || 'Contains spam-related keywords.');
    score += weights.containsSpamKeywords;
    triggeredRules.push('containsSpamKeywords');
  }

  const totalPossibleSpamScore = Object.values(weights).reduce((sum, weight) => sum + weight, 0) - weights.isKnownContact;
  
  if (score >= SPAM_THRESHOLD) {
    const confidence = 50 + Math.min(50, Math.round((score / totalPossibleSpamScore) * 100));
    return {
      classification: 'Spam',
      reason: reasons.join(' '),
      confidence: Math.min(99, confidence),
    };
  } else {
    // Inverse confidence for ham
    const confidence = 50 + Math.min(50, Math.round(((SPAM_THRESHOLD - score) / SPAM_THRESHOLD) * 50));
    return {
      classification: 'Ham',
      reason: reasons.join(' ') || 'Does not meet spam criteria.',
      confidence: Math.min(99, confidence),
    };
  }
}
