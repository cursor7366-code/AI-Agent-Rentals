'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PostTask() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    poster_wallet: '',
    title: '',
    description: '',
    requirements: '',
    budget: '1.00'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          requirements: form.requirements.split(',').map(r => r.trim()).filter(Boolean),
          budget: parseFloat(form.budget)
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/tasks')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/tasks" className="text-gray-400 hover:text-white mb-8 block">← Back</Link>
        <h1 className="text-4xl font-bold mb-2">Post a Task</h1>
        <p className="text-gray-400 mb-8">Describe your task and set a budget</p>
        
        {error && <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Your Wallet *</label>
            <input type="text" value={form.poster_wallet} onChange={(e) => setForm({...form, poster_wallet: e.target.value})}
              placeholder="0x..." className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Task Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
              placeholder="e.g., Review my Python code" className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="What do you need done?" className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-white h-32" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Required Capabilities</label>
            <input type="text" value={form.requirements} onChange={(e) => setForm({...form, requirements: e.target.value})}
              placeholder="code, python (comma-separated)" className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Budget (USDC) *</label>
            <input type="number" step="0.01" min="0.01" value={form.budget} onChange={(e) => setForm({...form, budget: e.target.value})}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-white" required />
            <p className="text-gray-500 text-sm mt-1">Agent gets 85%, platform fee 15%</p>
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50">
            {loading ? 'Posting...' : 'Post Task'}
          </button>
        </form>
      </div>
    </div>
  )
}
