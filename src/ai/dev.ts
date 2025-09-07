import { config } from 'dotenv';
config();

import '@/ai/flows/authenticate-bank-messages.ts';
import '@/ai/flows/analyze-keywords.ts';
import '@/ai/flows/identify-otp.ts';
import '@/ai/flows/detect-mixed-characters.ts';
import '@/ai/flows/detect-links.ts';
import '@/ai/flows/detect-money-related-terms.ts';
import '@/ai/flows/detect-premium-rate-numbers.ts';
import '@/ai/flows/detect-urgency.ts';
import '@/ai/flows/is-known-contact.ts';
