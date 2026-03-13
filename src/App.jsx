import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', label: 'Decisions' },
  { path: '/tasks', label: 'Tasks' },
  { path: '/priorities', label: 'Priorities' },
  { path: '/renewals', label: 'Renewals' },
]

function Placeholder({ title }) {
  return (
    <div style={{ padding: '2rem', color: '#e2e8f0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{title}</h2>
      <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Coming soon.</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0f1e',
        fontFamily: 'DM Sans, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          borderBottom: '1px solid #1e293b',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
        }}>
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.1em',
          }}>
            BASE COMMAND
          </span>

          <nav style={{ display: 'flex', gap: '0.25rem' }}>
            {NAV_ITEMS.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                style={({ isActive }) => ({
                  padding: '0.4rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: isActive ? '#38bdf8' : '#64748b',
                  backgroundColor: isActive ? '#0f172a' : 'transparent',
                  transition: 'all 0.15s',
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Placeholder title="Decisions" />} />
            <Route path="/tasks" element={<Placeholder title="Tasks" />} />
            <Route path="/priorities" element={<Placeholder title="Priorities" />} />
            <Route path="/renewals" element={<Placeholder title="Renewals" />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  )
}