import { useEffect, useState } from 'react'

function App() {
  const [msg, setMsg] = useState('loading...')

  useEffect(() => {
    fetch('http://localhost:8080/api/health')
      .then(res => res.text())
      .then(setMsg)
      .catch(() => setMsg('backend not reachable'))
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>FinSmart</h1>
      <p>Status: {msg}</p>
    </div>
  )
}
export default App

