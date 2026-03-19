import { useEffect, useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function WakeUpScreen({ onReady }) {
  const [status, setStatus] = useState('loading')
  const [time, setTime] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTime(t => t + 1), 1000)

    const checkServer = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/dashboard/stats`)
        if (res.ok) {
          setStatus('ready')
          clearInterval(timer)
          setTimeout(onReady, 300)
          return
        }
      } catch {}

      setTimeout(checkServer, 3000)
    }

    checkServer()

    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      gap: 12
    }}>
      <div style={{
        width: 30,
        height: 30,
        border: '4px solid #ddd',
        borderTop: '4px solid #333',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />

      {status === 'loading' && (
        <>
          <p>Backend is starting... please wait</p>
          <small>Free tier cold start (~30–60s) • {time}s</small>
        </>
      )}

      {status === 'ready' && <p>Loading app...</p>}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
