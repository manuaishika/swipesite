export const PROMPTS = [
  { id: 'q1', label: 'What is the main claim?' },
  { id: 'q2', label: 'What was varied and what was measured?' },
  { id: 'q3', label: 'What is the gap between the evidence and the claim?' },
  { id: 'q4', label: "What conclusion might a reader draw that the abstract doesn't support?" },
  { id: 'q5', label: 'What is an alternative explanation?' },
  { id: 'q6', label: 'What experiment would you run next, with which controls, and what result would change your mind?' },
  { id: 'q7', label: 'In what scenario does this research matter a lot, and in what scenario little?' },
] as const

export const CRITERIA = [
  { id: 'clarity', label: 'Clarity' },
  { id: 'evidence', label: 'Evidence vs claim reasoning' },
  { id: 'alternatives', label: 'Quality of alternatives' },
] as const

export type Answers = Record<string, string>
export type Scores = Record<string, Record<string, number>>

export const LIMITS = {
  minMinutes: 5,
  maxMinutes: 120,
  defaultMinutes: 30,
  submitGraceMs: 60_000,
  maxAnswerChars: 4000,
  minTotalAnswerChars: 200,
  minCommentChars: 20,
  maxCommentChars: 1500,
  reviewsPerSubmission: 2,
  maxOpenReviews: 3,
  reportsToHide: 3,
} as const

// Per user, per rolling hour.
export const RATE_LIMITS = {
  start_session: 10,
  submit_answers: 10,
  claim_review: 15,
  submit_review: 20,
  file_report: 10,
} as const
export const RATE_WINDOW_MS = 60 * 60 * 1000

export const ARXIV_ATTRIBUTION =
  'Abstracts and metadata are retrieved from arXiv via the arXiv API. Thank you to arXiv for use of its open access interoperability.'
