/**
 * ArXiv API integration
 * Documentation: https://arxiv.org/help/api/user-manual
 */

import { arrayToString } from './json-helpers'

export interface ArxivPaper {
  id: string
  title: string
  summary: string
  authors: string[]
  published: string
  updated: string
  categories: string[]
  link: string
  pdfLink: string
  doi?: string
}

export interface ArxivSearchParams {
  searchQuery?: string
  category?: string
  maxResults?: number
  sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate'
  sortOrder?: 'ascending' | 'descending'
}

/**
 * Fetch papers from ArXiv API
 */
export async function fetchArxivPapers(
  params: ArxivSearchParams = {}
): Promise<ArxivPaper[]> {
  const {
    searchQuery = '',
    category = '',
    maxResults = 50,
    sortBy = 'submittedDate',
    sortOrder = 'descending',
  } = params

  // Build search query
  let query = searchQuery
  if (category) {
    query = query ? `${query} AND cat:${category}` : `cat:${category}`
  }

  // ArXiv API URL
  const baseUrl = 'https://export.arxiv.org/api/query'
  const searchParams = new URLSearchParams({
    search_query: query || 'all',
    start: '0',
    max_results: maxResults.toString(),
    sortBy: sortBy,
    sortOrder: sortOrder,
  })

  try {
    const response = await fetch(`${baseUrl}?${searchParams.toString()}`)
    if (!response.ok) {
      throw new Error(`ArXiv API error: ${response.statusText}`)
    }

    const xmlText = await response.text()
    return parseArxivXML(xmlText)
  } catch (error) {
    console.error('Error fetching from ArXiv:', error)
    throw error
  }
}

/**
 * Fetch specific papers from the ArXiv API by id (e.g. "2212.08073").
 */
export async function fetchArxivPapersByIds(ids: string[]): Promise<ArxivPaper[]> {
  const searchParams = new URLSearchParams({
    id_list: ids.join(','),
    max_results: ids.length.toString(),
  })
  const response = await fetch(`https://export.arxiv.org/api/query?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error(`ArXiv API error: ${response.statusText}`)
  }
  return parseArxivXML(await response.text())
}

/**
 * Parse ArXiv XML response
 */
function parseArxivXML(xmlText: string): ArxivPaper[] {
  // Simple XML parsing - in production, use a proper XML parser
  const papers: ArxivPaper[] = []
  
  // Extract entries using regex (simple approach)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match

  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entry = match[1]
    
    try {
      const id = extractXMLValue(entry, 'id') || ''
      const arxivId = id.split('/').pop() || ''
      
      const title = extractXMLValue(entry, 'title')?.replace(/\n/g, ' ').trim() || ''
      const summary = extractXMLValue(entry, 'summary')?.replace(/\n/g, ' ').trim() || ''
      const published = extractXMLValue(entry, 'published') || ''
      const updated = extractXMLValue(entry, 'updated') || ''
      
      // Extract authors
      const authorMatches = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g) || []
      const authors = authorMatches.map(author => {
        const nameMatch = author.match(/<name>([\s\S]*?)<\/name>/)
        return nameMatch ? nameMatch[1].trim() : ''
      }).filter(Boolean)

      // Extract categories
      const categoryMatches = entry.match(/<category term="([^"]+)"[^>]*\/>/g) || []
      const categories = categoryMatches.map(cat => {
        const termMatch = cat.match(/term="([^"]+)"/)
        return termMatch ? termMatch[1] : ''
      }).filter(Boolean)

      // Extract links
      const linkMatches = entry.match(/<link[^>]*href="([^"]+)"[^>]*\/>/g) || []
      let link = ''
      let pdfLink = ''
      
      linkMatches.forEach(linkTag => {
        const hrefMatch = linkTag.match(/href="([^"]+)"/)
        if (hrefMatch) {
          const href = hrefMatch[1]
          if (href.includes('abs')) {
            link = href
          } else if (href.includes('pdf')) {
            pdfLink = href
          }
        }
      })

      // Extract DOI if present
      const doiMatch = entry.match(/<arxiv:doi[^>]*>([\s\S]*?)<\/arxiv:doi>/)
      const doi = doiMatch ? doiMatch[1].trim() : undefined

      if (title && summary) {
        papers.push({
          id: arxivId,
          title,
          summary,
          authors,
          published,
          updated,
          categories,
          link,
          pdfLink,
          doi,
        })
      }
    } catch (error) {
      console.error('Error parsing ArXiv entry:', error)
    }
  }

  return papers
}

/**
 * Extract value from XML tag
 */
function extractXMLValue(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

/**
 * Convert ArXiv paper to database format
 */
export function arxivPaperToDbFormat(arxivPaper: ArxivPaper) {
  // Extract keywords from title and abstract (simple approach)
  const text = `${arxivPaper.title} ${arxivPaper.summary}`.toLowerCase()
  const commonKeywords = [
    'machine learning', 'deep learning', 'neural network', 'computer vision',
    'natural language processing', 'nlp', 'reinforcement learning',
    'transformer', 'attention', 'convolutional', 'generative', 'adversarial',
    'optimization', 'classification', 'regression', 'clustering',
    'feature extraction', 'dimensionality reduction', 'unsupervised',
    'supervised', 'semi-supervised', 'transfer learning', 'few-shot',
  ]

  const keywords: string[] = []
  commonKeywords.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      keywords.push(keyword)
    }
  })

  // If no keywords found, use categories
  if (keywords.length === 0) {
    keywords.push(...arxivPaper.categories.slice(0, 5))
  }

  return {
    title: arxivPaper.title,
    abstract: arxivPaper.summary,
    authors: arrayToString(arxivPaper.authors),
    arxivId: arxivPaper.id,
    doi: arxivPaper.doi || null,
    url: arxivPaper.link || null,
    pdfUrl: arxivPaper.pdfLink || null,
    publishedDate: arxivPaper.published ? new Date(arxivPaper.published) : null,
    venue: 'arXiv',
    keywords: arrayToString(keywords.slice(0, 10)), // Limit to 10 keywords
    categories: arrayToString(arxivPaper.categories),
    citations: 0, // ArXiv doesn't provide citation count
    views: 0,
  }
}
