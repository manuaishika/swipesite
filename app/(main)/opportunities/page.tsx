import { Mail, Plus, ExternalLink } from 'lucide-react'
import Link from 'next/link'

// Public: listed in the logged-out navbar, so it must not bounce visitors to login.
export default function OpportunitiesPage() {

  // This would come from a database in production
  const opportunities = [
    {
      id: '1',
      title: 'Research Internship - Computer Vision Lab',
      organization: 'Stanford AI Lab',
      contact: 'cvlab@stanford.edu',
      description: 'Looking for motivated students interested in computer vision research. Work on cutting-edge projects with leading researchers.',
      requirements: 'PhD or Masters student, experience with PyTorch, strong publication record',
      deadline: '2025-03-15',
      type: 'internship',
    },
    {
      id: '2',
      title: 'Postdoc Position - NLP Research',
      organization: 'MIT CSAIL',
      contact: 'nlp-group@mit.edu',
      description: 'Postdoctoral position in natural language processing. Focus on large language models and their applications.',
      requirements: 'PhD in CS or related field, strong background in NLP, publications in top venues',
      deadline: '2025-04-01',
      type: 'postdoc',
    },
    {
      id: '3',
      title: 'PhD Student Position - Machine Learning',
      organization: 'UC Berkeley',
      contact: 'ml-admissions@berkeley.edu',
      description: 'PhD position available in machine learning theory and practice. Full funding available.',
      requirements: 'Bachelors or Masters in CS, strong math background, research experience preferred',
      deadline: '2025-12-15',
      type: 'phd',
    },
    {
      id: '4',
      title: 'Research Collaboration Opportunity',
      organization: 'OpenAI',
      contact: 'research@openai.com',
      description: 'Seeking collaborators for research on AI safety and alignment. Open to researchers from various institutions.',
      requirements: 'Active research in AI/ML, interest in safety and alignment',
      deadline: 'Ongoing',
      type: 'collaboration',
    },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'internship':
        return 'bg-blue-100 text-blue-700'
      case 'postdoc':
        return 'bg-purple-100 text-purple-700'
      case 'phd':
        return 'bg-green-100 text-green-700'
      case 'collaboration':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cold Emailing Opportunities</h1>
          <p className="text-gray-600">
            Research positions, internships, and collaboration opportunities you can reach out to
          </p>
        </div>
        <Link
          href="/opportunities/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Post Opportunity</span>
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">All</button>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
          Internships
        </button>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
          Postdocs
        </button>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
          PhD Positions
        </button>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
          Collaborations
        </button>
      </div>

      <div className="space-y-4">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{opp.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(opp.type)}`}
                  >
                    {opp.type}
                  </span>
                </div>
                <p className="text-gray-600 font-medium mb-1">{opp.organization}</p>
                <p className="text-gray-700 mb-4">{opp.description}</p>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Requirements:</strong> {opp.requirements}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{opp.contact}</span>
                </div>
                {opp.deadline !== 'Ongoing' && (
                  <span>
                    <strong>Deadline:</strong> {opp.deadline}
                  </span>
                )}
              </div>
              <a
                href={`mailto:${opp.contact}?subject=Inquiry: ${opp.title}`}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </a>
            </div>
          </div>
        ))}
      </div>

      {opportunities.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No opportunities posted yet</p>
          <p className="text-gray-400 mt-2">Be the first to post an opportunity!</p>
        </div>
      )}
    </div>
  )
}
