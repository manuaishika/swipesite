/**
 * Where other disciplines meet ML and AI safety. Each bridge is counted on arXiv with `terms`
 * (all must appear) and can be explored in the swipe deck through its arXiv categories.
 */
import type { StatTarget } from '@/lib/research-stats'
import { topicQuery } from '@/lib/research-stats'

export type Enjoy = 'theory' | 'data' | 'build' | 'society'

export const ENJOY: { id: Enjoy; label: string }[] = [
  { id: 'theory', label: 'Proofs and models' },
  { id: 'data', label: 'Data and experiments' },
  { id: 'build', label: 'Building things' },
  { id: 'society', label: 'People and policy' },
]

export type Bridge = { id: string; name: string; blurb: string; terms: string[]; cats: string[]; enjoy: Enjoy[] }
export type Background = { id: string; label: string; emoji: string; bridges: Bridge[] }

const b = (id: string, name: string, blurb: string, terms: string[], cats: string[], enjoy: Enjoy[]): Bridge => ({ id, name, blurb, terms, cats, enjoy })

export const BACKGROUNDS: Background[] = [
  {
    id: 'economics',
    label: 'Economics',
    emoji: '📈',
    bridges: [
      b('econ-mech', 'Mechanism design for AI', 'Incentives and auctions for and with AI agents', ['mechanism design'], ['cs.GT', 'econ.TH'], ['theory']),
      b('econ-causal', 'Causal ML', 'Machine learning for causal effects', ['double machine learning'], ['econ.EM', 'stat.ME'], ['data', 'theory']),
      b('econ-labour', 'AI and the labour market', 'Who gains and who loses from automation', ['labor market', 'artificial intelligence'], ['econ.GN', 'cs.CY'], ['society', 'data']),
      b('econ-agents', 'LLMs as economic agents', 'Simulating markets and behaviour with language models', ['language model', 'economic'], ['econ.GN', 'cs.AI'], ['data', 'build']),
    ],
  },
  {
    id: 'biology',
    label: 'Biology & medicine',
    emoji: '🧬',
    bridges: [
      b('bio-protein', 'Protein design', 'Generating and folding proteins with ML', ['protein design'], ['q-bio.BM', 'cs.LG'], ['build', 'data']),
      b('bio-singlecell', 'Single-cell genomics', 'Models of cells from sequencing data', ['single-cell'], ['q-bio.GN', 'q-bio.QM'], ['data']),
      b('bio-imaging', 'Medical imaging', 'Seeing disease in scans', ['medical image'], ['eess.IV', 'cs.CV'], ['build', 'data']),
      b('bio-clinical', 'Clinical language models', 'LLMs reading and writing medicine', ['clinical', 'language model'], ['cs.CL'], ['data', 'society']),
      b('bio-biosec', 'Biosecurity and AI', 'Keeping AI from enabling biological harm', ['biosecurity'], ['cs.CY', 'cs.CR'], ['society']),
    ],
  },
  {
    id: 'physics',
    label: 'Physics',
    emoji: '⚛️',
    bridges: [
      b('phys-pinn', 'Physics-informed ML', 'Neural networks that obey physical laws', ['physics-informed'], ['physics.comp-ph', 'cs.LG'], ['theory', 'build']),
      b('phys-statmech', 'Statistical physics of learning', 'Why deep networks learn, with physics tools', ['statistical mechanics', 'neural network'], ['cond-mat.dis-nn', 'stat.ML'], ['theory']),
      b('phys-qml', 'Quantum machine learning', 'Learning on and about quantum computers', ['quantum machine learning'], ['quant-ph'], ['theory', 'build']),
      b('phys-operator', 'Neural operators', 'Fast surrogates for simulations', ['neural operator'], ['cs.LG', 'math.NA'], ['build', 'theory']),
    ],
  },
  {
    id: 'psychology',
    label: 'Psychology & cognitive science',
    emoji: '🧠',
    bridges: [
      b('psy-tom', 'Machine psychology', 'Testing minds in language models', ['theory of mind', 'language model'], ['cs.CL', 'cs.AI'], ['data']),
      b('psy-hai', 'Human–AI interaction', 'How people trust, use and rely on AI', ['human-ai'], ['cs.HC'], ['society', 'data']),
      b('psy-persuasion', 'Persuasion and manipulation', 'Can AI change what people believe?', ['persuasion', 'language model'], ['cs.CL', 'cs.CY'], ['society', 'data']),
      b('psy-cogmodels', 'Cognitive models and RL', 'Learning and decisions in brains and machines', ['reinforcement learning', 'cognitive'], ['q-bio.NC', 'cs.LG'], ['theory', 'data']),
    ],
  },
  {
    id: 'neuroscience',
    label: 'Neuroscience',
    emoji: '🔬',
    bridges: [
      b('neuro-interp', 'Mechanistic interpretability', 'Reverse-engineering what networks compute', ['mechanistic interpretability'], ['cs.LG', 'cs.AI'], ['data', 'theory']),
      b('neuro-neuroai', 'NeuroAI', 'Brain-inspired models, model-inspired neuroscience', ['neuroai'], ['q-bio.NC', 'cs.NE'], ['theory', 'data']),
      b('neuro-decoding', 'Brain decoding', 'Reading images and words from brain activity', ['brain decoding'], ['q-bio.NC', 'eess.SP'], ['data', 'build']),
      b('neuro-repalign', 'Representational alignment', 'Do models and brains represent the world alike?', ['representational similarity'], ['q-bio.NC', 'cs.LG'], ['data', 'theory']),
    ],
  },
  {
    id: 'mathematics',
    label: 'Mathematics',
    emoji: '∑',
    bridges: [
      b('math-theory', 'Learning theory', 'When and why learning generalises', ['generalization bound'], ['stat.ML', 'cs.LG'], ['theory']),
      b('math-opt', 'Optimisation for deep learning', 'The maths of training', ['stochastic gradient descent'], ['math.OC', 'cs.LG'], ['theory']),
      b('math-formal', 'Autoformalisation', 'Language models that write and check proofs', ['theorem proving', 'language model'], ['cs.LO', 'cs.AI'], ['theory', 'build']),
      b('math-tda', 'Topological data analysis', 'The shape of data', ['topological data analysis'], ['math.AT', 'stat.ML'], ['theory', 'data']),
    ],
  },
  {
    id: 'law',
    label: 'Law & policy',
    emoji: '⚖️',
    bridges: [
      b('law-gov', 'AI governance', 'Rules, standards and institutions for AI', ['ai governance'], ['cs.CY'], ['society']),
      b('law-fair', 'Algorithmic fairness', 'Measuring and reducing unfair outcomes', ['algorithmic fairness'], ['cs.CY', 'cs.LG'], ['society', 'theory']),
      b('law-privacy', 'Privacy', 'Learning from data without exposing people', ['differential privacy'], ['cs.CR', 'cs.LG'], ['theory', 'build']),
      b('law-legalnlp', 'Legal NLP', 'Language models reading law', ['legal', 'language model'], ['cs.CL'], ['data', 'society']),
    ],
  },
  {
    id: 'philosophy',
    label: 'Philosophy',
    emoji: '🏛️',
    bridges: [
      b('phil-values', 'Value alignment', 'Getting AI to do what we actually mean', ['value alignment'], ['cs.AI', 'cs.CY'], ['theory', 'society']),
      b('phil-moral', 'Moral reasoning in AI', 'How models handle ethical choices', ['moral', 'language model'], ['cs.CL', 'cs.CY'], ['society', 'data']),
      b('phil-xai', 'Explainability', 'What counts as an explanation of a model?', ['explainable ai'], ['cs.AI', 'cs.LG'], ['theory', 'society']),
      b('phil-mind', 'Machine consciousness', 'Could AI systems have experiences?', ['consciousness', 'artificial intelligence'], ['cs.AI', 'q-bio.NC'], ['theory']),
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    emoji: '💹',
    bridges: [
      b('fin-ts', 'Financial forecasting', 'Deep learning on market time series', ['financial time series'], ['q-fin.ST', 'cs.LG'], ['data', 'build']),
      b('fin-fraud', 'Fraud detection', 'Spotting anomalies in transactions', ['fraud detection'], ['cs.LG', 'cs.CR'], ['data', 'build']),
      b('fin-llm', 'LLMs in finance', 'Language models for financial text and decisions', ['financial', 'language model'], ['q-fin.CP', 'cs.CL'], ['data', 'build']),
    ],
  },
  {
    id: 'linguistics',
    label: 'Linguistics',
    emoji: '🗣️',
    bridges: [
      b('ling-syntax', 'Syntax inside language models', 'What grammar do models learn?', ['syntactic', 'language model'], ['cs.CL'], ['theory', 'data']),
      b('ling-lowres', 'Low-resource languages', 'AI for the world’s other 7,000 languages', ['low-resource languages'], ['cs.CL'], ['data', 'build', 'society']),
      b('ling-acq', 'Language acquisition', 'What children and models learn from data', ['language acquisition'], ['cs.CL', 'q-bio.NC'], ['theory', 'data']),
    ],
  },
  {
    id: 'climate',
    label: 'Climate & earth science',
    emoji: '🌍',
    bridges: [
      b('clim-weather', 'ML weather forecasting', 'Learned models that rival physics simulators', ['weather forecasting', 'deep learning'], ['physics.ao-ph', 'cs.LG'], ['build', 'data']),
      b('clim-remote', 'Remote sensing', 'Reading the planet from satellite images', ['remote sensing'], ['cs.CV', 'eess.IV'], ['data', 'build']),
      b('clim-ml', 'Climate change and ML', 'Mitigation, adaptation and energy', ['climate change', 'machine learning'], ['cs.LG', 'cs.CY'], ['society', 'data']),
    ],
  },
  {
    id: 'chemistry',
    label: 'Chemistry & materials',
    emoji: '⚗️',
    bridges: [
      b('chem-molgen', 'Molecule generation', 'Designing new drugs and molecules', ['molecule generation'], ['q-bio.BM', 'cs.LG'], ['build', 'data']),
      b('chem-materials', 'Materials discovery', 'Finding new materials with ML', ['materials discovery'], ['cond-mat.mtrl-sci', 'cs.LG'], ['data', 'build']),
      b('chem-potentials', 'ML interatomic potentials', 'Quantum accuracy at simulation speed', ['interatomic potential'], ['physics.chem-ph', 'cond-mat.mtrl-sci'], ['theory', 'build']),
    ],
  },
]

/** What the topic explorer and the counts use for a bridge, e.g. "labor market + artificial intelligence". */
export const bridgeTopic = (br: Bridge) => br.terms.join(' + ')

export function bridgeTarget(br: Bridge): StatTarget {
  const q = topicQuery(bridgeTopic(br))!
  return { key: `bridge:${br.id}`, kind: 'bridge', label: br.name, query: q.query, windows: 2 }
}

export const backgroundById = (id: string | null | undefined) => BACKGROUNDS.find((x) => x.id === id) ?? null
