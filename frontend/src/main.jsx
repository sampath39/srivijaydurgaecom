import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { store } from './store/index.js'
import './index.css'

// Global error overlay for debugging browser errors
window.onerror = function (message, source, lineno, colno, error) {
  const errDiv = document.createElement('div')
  errDiv.style.position = 'fixed'
  errDiv.style.top = '0'
  errDiv.style.left = '0'
  errDiv.style.width = '100%'
  errDiv.style.background = '#ef4444'
  errDiv.style.color = 'white'
  errDiv.style.padding = '12px'
  errDiv.style.zIndex = '999999'
  errDiv.style.fontSize = '14px'
  errDiv.style.fontWeight = 'bold'
  errDiv.style.fontFamily = 'monospace'
  errDiv.innerText = `Error: ${message} at ${source}:${lineno}:${colno}`
  document.body.appendChild(errDiv)
}

window.addEventListener('unhandledrejection', function (event) {
  const errDiv = document.createElement('div')
  errDiv.style.position = 'fixed'
  errDiv.style.bottom = '0'
  errDiv.style.left = '0'
  errDiv.style.width = '100%'
  errDiv.style.background = '#991b1b'
  errDiv.style.color = 'white'
  errDiv.style.padding = '12px'
  errDiv.style.zIndex = '999999'
  errDiv.style.fontSize = '14px'
  errDiv.style.fontWeight = 'bold'
  errDiv.style.fontFamily = 'monospace'
  errDiv.innerText = `Promise Rejection: ${event.reason?.message || event.reason}`
  document.body.appendChild(errDiv)
})

// Apply saved dark mode immediately
if (localStorage.getItem('svdke_dark') === 'true') {
  document.documentElement.classList.add('dark')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1030',
            color: '#fff',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />
    </Provider>
  </React.StrictMode>
)
