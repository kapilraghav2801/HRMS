import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'
import { ToastProvider } from './components/Toast'
import WakeUpScreen from './components/WakeUpScreen'

export default function App() {
  const [serverReady, setServerReady] = useState(false)

  if (!serverReady) {
    return <WakeUpScreen onReady={() => setServerReady(true)} />
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/attendance" element={<Attendance />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  )
}
