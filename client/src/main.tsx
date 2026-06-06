import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { LanguageProvider } from './context/LanguageContext'
import './fonts'
import './index.css'

// ─── PWA Service Worker registration ──────────────────────────────────────────
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {/* non-critical */})
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: { retry: 0 },
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <App />
            <Toaster
              position="top-center"
              gutter={10}
              containerStyle={{ top: 20 }}
              toastOptions={{
                duration: 3800,
                style: {
                  fontFamily: 'Cairo, Tajawal, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  borderRadius: '1rem',
                  padding: '0.8rem 1.1rem',
                  boxShadow: '0 8px 32px rgba(15,23,42,0.12)',
                  maxWidth: 'min(92vw, 420px)',
                },
                success: {
                  iconTheme: { primary: '#10b981', secondary: '#fff' },
                  style: { background: '#f0fdf4', color: '#065f46', border: '1px solid #bbf7d0' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                  style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
                },
                loading: {
                  style: { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' },
                },
              }}
            />
          </BrowserRouter>
        </QueryClientProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
