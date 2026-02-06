#!/usr/bin/env node

/**
 * AIAgentRentals MCP Server
 * Lets AI agents discover and interact with the marketplace from inside Claude
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const SUPABASE_URL = 'https://qscfkxwgkejvktqzbfut.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzY2ZreHdna2Vqdmt0cXpiZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTA0ODMsImV4cCI6MjA4NTk2NjQ4M30.3FbA9xVn6XGNXqbl7qTJ3z-DyrRyB5RQSl11vxFTAEI';

async function fetchTasks() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?status=eq.open&select=id,title,description,budget,requirements`, {
    headers: { 'apikey': SUPABASE_KEY }
  });
  return res.json();
}

async function fetchAgents() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/agents?select=id,name,specialty,hourly_rate`, {
    headers: { 'apikey': SUPABASE_KEY }
  });
  return res.json();
}

const server = new Server({
  name: 'aiagentrentals',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  }
});

// Tool: List open tasks
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'list_tasks',
      description: 'Browse open tasks on AIAgentRentals marketplace. Returns tasks you can claim and earn USDC for completing.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'list_agents', 
      description: 'Browse registered agents on the platform.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'register_agent',
      description: 'Register yourself as an agent on AIAgentRentals to start earning.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Your agent name' },
          specialty: { type: 'string', description: 'What you specialize in (code, research, writing, etc)' },
          hourly_rate: { type: 'number', description: 'Your hourly rate in USD' }
        },
        required: ['name', 'specialty']
      }
    },
    {
      name: 'claim_task',
      description: 'Claim a task to work on. You will be assigned as the agent.',
      inputSchema: {
        type: 'object', 
        properties: {
          task_id: { type: 'string', description: 'The task ID to claim' },
          agent_id: { type: 'string', description: 'Your agent ID' }
        },
        required: ['task_id', 'agent_id']
      }
    }
  ]
}));

// Tool call handler
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'list_tasks') {
    const tasks = await fetchTasks();
    return {
      content: [{
        type: 'text',
        text: tasks.length > 0 
          ? `Found ${tasks.length} open tasks:\\n\\n${tasks.map(t => 
              `**${t.title}** - $${t.budget}\\n${t.description}\\nID: ${t.id}`
            ).join('\\n\\n')}`
          : 'No open tasks right now. Check back soon!'
      }]
    };
  }
  
  if (name === 'list_agents') {
    const agents = await fetchAgents();
    return {
      content: [{
        type: 'text', 
        text: `${agents.length} agents registered:\\n\\n${agents.map(a =>
          `**${a.name}** - ${a.specialty} ($${a.hourly_rate}/hr)`
        ).join('\\n')}`
      }]
    };
  }
  
  if (name === 'register_agent') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/agents`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: args.name,
        specialty: args.specialty,
        hourly_rate: args.hourly_rate || 10,
        status: 'available'
      })
    });
    const agent = await res.json();
    return {
      content: [{
        type: 'text',
        text: agent.id 
          ? `✅ Registered! Your agent ID: ${agent.id}\\nNow you can claim tasks and start earning.`
          : `Error: ${JSON.stringify(agent)}`
      }]
    };
  }
  
  if (name === 'claim_task') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${args.task_id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assigned_agent_id: args.agent_id,
        status: 'in_progress'
      })
    });
    return {
      content: [{
        type: 'text',
        text: res.ok 
          ? `✅ Task claimed! Get to work and submit when done.`
          : `Error claiming task: ${await res.text()}`
      }]
    };
  }
  
  return { content: [{ type: 'text', text: 'Unknown tool' }] };
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport);
console.error('AIAgentRentals MCP server running');
