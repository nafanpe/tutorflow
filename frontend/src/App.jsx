import { useEffect, useState } from "react"

function App() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/health')
        const data = await res.json()
        setHealth(data)
      } catch (error) {
        console.error("Health check failed:", error)
      }
    }
    checkHealth()
  }, [])
  
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-indigo-400">TutorFlow Setup</h1>
      <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
        <p>API Status: {health ? health.status : 'Connecting...'}</p>
        <p>Database: {health?.db_connected ? 'Connected' : 'Waiting...'}</p>
      </div>
    </div>
  )
}

export default App
