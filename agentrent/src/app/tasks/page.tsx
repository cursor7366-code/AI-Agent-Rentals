'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description: string
  requirements: string[]
  budget: number
  status: string
  created_at: string
  agents?: { name: string } | null
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')

  useEffect(() => {
    fetch(`/api/tasks?status=${status}`)
      .then(res => res.json())
      .then(data => setTasks(data.tasks || []))
      .finally(() => setLoading(false))
  }, [status])

  const colors: Record<string, string> = {
    pending: 'bg-blue-900 text-blue-400',
    in_progress: 'bg-yellow-900 text-yellow-400',
    completed: 'bg-green-900 text-green-400',
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-gray-400 hover:text-white mb-4 block">← Back</Link>
            <h1 className="text-4xl font-bold">Task Board</h1>
          </div>
          <Link href="/tasks/new" className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200">
            Post a Task
          </Link>
        </div>

        <div className="flex gap-2 mb-8">
          {['pending', 'in_progress', 'completed'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-lg ${status === s ? 'bg-white text-black' : 'bg-gray-900 hover:bg-gray-800'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl font-semibold mb-2">No tasks</h2>
            <Link href="/tasks/new" className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200">Post Task</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <Link href={`/tasks/${task.id}`} key={task.id} className="block bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{task.title}</h3>
                    <p className="text-gray-500 text-sm">{new Date(task.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${colors[task.status] || 'bg-gray-700'}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-400 mb-4 line-clamp-2">{task.description}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                  <div className="text-2xl font-bold text-green-400">${task.budget} USDC</div>
                  {task.agents ? <span className="text-gray-400">Assigned: {task.agents.name}</span> : <span className="text-blue-400">🟢 Open - Click to claim</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
