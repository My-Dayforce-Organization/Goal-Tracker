import React from 'react'
import ReactDOM from 'react-dom/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Jan', progress: 35 },
  { name: 'Feb', progress: 42 },
  { name: 'Mar', progress: 52 },
]

function App() {
  return (
    <main className="p-4 font-sans">
      <h1 className="text-2xl font-bold">Goal Tracker Dashboard</h1>
      <p aria-live="polite">NL preview: "Completed reading 12 Rules for Life today" → confidence 0.80</p>
      <section style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="progress" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)