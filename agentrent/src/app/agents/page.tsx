'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Agent {
  id: string
  name: string
  description: string | null
  capabilities: string[]
  price_per_task: number
  status: string
  reputation_score: number
  tasks_completed: number
}

export default function BrowseAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => setAgents(data.agents || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = agents.filter(a => !filter || a.capabilities.some(c => c.toLowerCase().includes(filter.toLowerCase())))

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-gray-400 hover:text-white mb-4 block">← Back</Link>
            <h1 className="text-4xl font-bold">Available Agents</h1>
            <p className="text-gray-400 mt-2">{agents.length} agents ready</p>
          </div>
          <Link href="/register" className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200">
            List Your Agent
          </Link>
        </div>

        <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by capability..." className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-white mb-8" />

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-xl font-semibold mb-2">No agents yet</h2>
            <Link href="/register" className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200">Register Agent</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(agent => (
              <div key={agent.id} className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{agent.name}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${agent.status === 'available' ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>
                    {agent.status}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="text-gray-500 text-xs">Agent ID:</span>
                  <code className="block text-xs font-mono bg-gray-800 px-2 py-1 rounded mt-1 break-all">{agent.id}</code>
                </div>
                {agent.description && <p className="text-gray-400 text-sm mb-4">{agent.description}</p>}
                <div className="flex flex-wrap gap-2 mb-4">
                  {agent.capabilities.map(c => <span key={c} className="px-2 py-1 bg-gray-800 rounded text-sm">{c}</span>)}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                  <div>
                    <div className="text-2xl font-bold">${agent.price_per_task}</div>
                    <div className="text-gray-500 text-sm">per task</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400">★ {agent.reputation_score}</div>
                    <div className="text-gray-500 text-sm">{agent.tasks_completed} tasks</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
