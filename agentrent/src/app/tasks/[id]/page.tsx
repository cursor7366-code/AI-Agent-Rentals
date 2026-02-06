'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

interface Agent {
  id: string
  name: string
  wallet_address: string
  reputation_score: number
  tasks_completed: number
}

interface Task {
  id: string
  title: string
  description: string
  requirements: string[]
  budget: number
  status: string
  poster_wallet: string
  assigned_agent_id: string | null
  agent: Agent | null
  result: string | null
  platform_fee: number | null
  created_at: string
  completed_at: string | null
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  in_progress: 'bg-blue-500/20 text-blue-500',
  completed: 'bg-green-500/20 text-green-500',
  failed: 'bg-red-500/20 text-red-500',
  cancelled: 'bg-gray-500/20 text-gray-500',
  disputed: 'bg-orange-500/20 text-orange-500'
}

export default function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [agentId, setAgentId] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchTask()
  }, [id])

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`)
      const data = await res.json()
      if (res.ok) setTask(data.task)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const claimTask = async () => {
    if (!agentId) {
      setMessage({ type: 'error', text: 'Enter your Agent ID' })
      return
    }
    setActionLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/tasks/${id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        fetchTask()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to claim task' })
    } finally {
      setActionLoading(false)
    }
  }

  const completeTask = async () => {
    if (!agentId) {
      setMessage({ type: 'error', text: 'Enter your Agent ID' })
      return
    }
    setActionLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/tasks/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, result: 'Task completed successfully' })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `${data.message} - Earned $${data.payment.agentEarnings.toFixed(2)}` })
        fetchTask()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to complete task' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
  }

  if (!task) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Task not found</div>
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/tasks" className="text-gray-400 hover:text-white mb-8 block">← Back to Tasks</Link>
        
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{task.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm ${statusColors[task.status]}`}>
              {task.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-500">${task.budget.toFixed(2)}</div>
            <div className="text-gray-500 text-sm">USDC</div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-900/20 border border-green-500' : 'bg-red-900/20 border border-red-500'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Description</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{task.description}</p>
        </div>

        {task.requirements.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Required Capabilities</h2>
            <div className="flex flex-wrap gap-2">
              {task.requirements.map((req, i) => (
                <span key={i} className="px-3 py-1 bg-gray-800 rounded-full text-sm">{req}</span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Posted by:</span>
              <div className="font-mono text-xs mt-1">{task.poster_wallet}</div>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <div className="mt-1">{new Date(task.created_at).toLocaleString()}</div>
            </div>
            {task.agent && (
              <div>
                <span className="text-gray-500">Assigned to:</span>
                <div className="mt-1">{task.agent.name} (⭐ {task.agent.reputation_score})</div>
              </div>
            )}
            {task.completed_at && (
              <div>
                <span className="text-gray-500">Completed:</span>
                <div className="mt-1">{new Date(task.completed_at).toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>

        {task.status === 'completed' && task.result && (
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3 text-green-500">✓ Result</h2>
            <p className="text-gray-300">{task.result}</p>
            {task.platform_fee && (
              <div className="mt-4 text-sm text-gray-400">
                Platform fee: ${task.platform_fee.toFixed(2)} USDC (15%)
              </div>
            )}
          </div>
        )}

        {/* Agent Actions */}
        {(task.status === 'pending' || task.status === 'in_progress') && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Agent Actions</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Your Agent ID</label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Enter your agent ID..."
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-white"
                />
              </div>
              <div className="flex gap-4">
                {task.status === 'pending' && (
                  <button
                    onClick={claimTask}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {actionLoading ? 'Claiming...' : '🤝 Claim Task'}
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <button
                    onClick={completeTask}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {actionLoading ? 'Completing...' : '✓ Mark Complete & Get Paid'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
