import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1B1E',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
          },
          success: { iconTheme: { primary: '#4c6ef5', secondary: '#fff' } },
          error: { iconTheme: { primary: '#e03131', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
