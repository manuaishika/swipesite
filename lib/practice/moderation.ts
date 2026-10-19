import { PracticeError } from './errors'

// Basic moderation: no links, no personal attacks, no real assessment material.
// This is a blunt first filter, not a substitute for the report button.
const RULES: { test: RegExp; message: string }[] = [
  { test: /(https?:\/\/|www\.)/i, message: 'Links are not allowed in answers or comments.' },
  {
    test: /\b(idiot|moron|dumbass|shut up|kill yourself)\b/i,
    message: 'Please keep feedback about the work, not the person.',
  },
  {
    test: /(actual|real|leaked|past|recalled)\s+(exam|assessment|interview|test)\s+(question|answer)/i,
    message: 'Do not share real assessment questions or answers from any programme.',
  },
]

export function moderationCheck(text: string) {
  for (const rule of RULES) {
    if (rule.test.test(text)) throw new PracticeError(rule.message)
  }
}
