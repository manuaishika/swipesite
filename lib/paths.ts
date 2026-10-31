// Research career paths, as a graph. Short on purpose: what it is, how long, how to get in, money.
// Typical for the US, UK and Europe; details vary by country and field.

export type PathNode = {
  id: string
  label: string
  col: 0 | 1 | 2 | 3 | 4
  row: number // position in its column, top to bottom
  length: string
  what: string
  getIn: string
  money: string
  tip: string
}

export const COLUMNS = ['Start', 'Next 1–2 years', 'Doctorate', 'After the PhD', 'Long term']

export const NODES: PathNode[] = [
  { id: 'undergrad', label: 'Undergrad', col: 0, row: 0, length: '3–4 years', what: 'Coursework, and your first taste of research: a project, a thesis, a summer internship.', getIn: '—', money: 'Tuition; varies hugely by country.', tip: 'Email a professor whose paper you liked and ask to help on a project.' },
  { id: 'masters', label: "Master's", col: 1, row: 0, length: '1–2 years', what: 'Advanced courses, often with a research thesis.', getIn: 'Grades, references and a statement of purpose.', money: 'Often self-funded; scholarships exist; some research master’s are paid.', tip: 'In the UK and much of Europe it’s the usual step before a PhD.' },
  { id: 'predoc', label: 'Pre-doc / RA', col: 1, row: 1, length: '1–2 years', what: 'A paid research-assistant job in a lab or institute, on real projects.', getIn: 'Apply to RA postings; strong coding or maths helps.', money: 'Salaried.', tip: 'Common in economics and growing in CS: a strong route into top PhDs.' },
  { id: 'programme', label: 'Research programme', col: 1, row: 2, length: 'Weeks to a year', what: 'Mentored research programmes, fellowships and residencies, e.g. MATS for AI safety.', getIn: 'An application with past work or a project idea.', money: 'Usually a stipend.', tip: 'A fast way to test a field and earn a reference.' },
  { id: 'industryjob', label: 'Industry job', col: 1, row: 3, length: 'Any', what: 'Engineering or data work that builds skills (and savings).', getIn: 'Ordinary job applications.', money: 'Salaried.', tip: 'Plenty of PhD students come back after a few years in industry.' },
  { id: 'phd', label: 'PhD', col: 2, row: 0, length: 'US 5–6 years · UK/EU 3–4 years', what: 'Original research, papers and a thesis. This is where you build your niche.', getIn: 'Research experience and references matter most.', money: 'Usually funded: tuition plus a stipend.', tip: 'Choose the advisor and group, not just the university.' },
  { id: 'postdoc', label: 'Postdoc', col: 3, row: 0, length: '1–3 years per position', what: 'Independent research, mentoring students, building your record.', getIn: 'Papers, network and your advisor’s references.', money: 'Salaried, fixed-term.', tip: 'Many people do one or two postdocs before faculty jobs.' },
  { id: 'scientist', label: 'Research scientist', col: 3, row: 1, length: 'Open-ended', what: 'Research in an industry or non-profit lab.', getIn: 'Usually a PhD with strong papers.', money: 'Well paid.', tip: 'Frontier AI labs also hire for safety and alignment research.' },
  { id: 'engineer', label: 'Research engineer', col: 3, row: 2, length: 'Open-ended', what: 'Builds the systems, tools and experiments research runs on.', getIn: 'Strong engineering; a PhD isn’t required.', money: 'Well paid.', tip: 'A common way into AI research, including safety work, without a PhD.' },
  { id: 'faculty', label: 'Faculty', col: 4, row: 0, length: 'Career', what: 'Run a group, teach, win grants, advise PhD students.', getIn: 'A strong research record, usually after postdocs.', money: 'Salaried; tenure-track in the US.', tip: 'Very competitive: few openings per field each year.' },
  { id: 'lead', label: 'Lab lead', col: 4, row: 1, length: 'Career', what: 'Set research direction and lead teams.', getIn: 'Years of strong research or engineering.', money: 'Well paid.', tip: 'Reached from both the academic and the industry side.' },
  { id: 'policy', label: 'Policy & governance', col: 4, row: 2, length: 'Career', what: 'Turn research into decisions: government, think tanks, standards bodies.', getIn: 'A master’s or PhD plus clear writing; fellowships help.', money: 'Salaried.', tip: 'AI governance is short of people who understand the technology.' },
]

// channel: drawn along the bottom of the map, for links that would otherwise cross a box
export const EDGES: { from: string; to: string; label?: string; channel?: boolean }[] = [
  { from: 'undergrad', to: 'masters' },
  { from: 'undergrad', to: 'predoc' },
  { from: 'undergrad', to: 'programme' },
  { from: 'undergrad', to: 'industryjob' },
  { from: 'undergrad', to: 'phd', label: 'US: often direct' },
  { from: 'masters', to: 'phd' },
  { from: 'predoc', to: 'phd' },
  { from: 'programme', to: 'phd' },
  { from: 'programme', to: 'engineer' },
  { from: 'industryjob', to: 'engineer' },
  { from: 'masters', to: 'policy', channel: true },
  { from: 'phd', to: 'postdoc' },
  { from: 'phd', to: 'scientist' },
  { from: 'phd', to: 'policy', channel: true },
  { from: 'postdoc', to: 'faculty' },
  { from: 'postdoc', to: 'scientist' },
  { from: 'scientist', to: 'lead' },
  { from: 'engineer', to: 'lead' },
  { from: 'engineer', to: 'scientist' },
]

export const FAQ: [string, string][] = [
  ['Do I need a master’s before a PhD?', 'In the US, usually not. In the UK and much of Europe, usually yes.'],
  ['Is a PhD paid?', 'Usually: tuition is covered and you get a stipend. Check each offer.'],
  ['What is a pre-doc?', 'A one-to-two-year paid research job between undergrad and a PhD. It gives experience and strong references.'],
  ['Can I switch fields?', 'Yes. Master’s degrees, pre-docs and research programmes are the usual bridges.'],
  ['Industry or academia?', 'Industry pays more and moves faster; academia gives freedom over what you study. Many people move between them.'],
  ['How do I get research experience as an undergrad?', 'Ask professors about projects, write a thesis, apply to summer research programmes.'],
]
