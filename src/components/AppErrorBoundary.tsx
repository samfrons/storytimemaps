'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Top-level Error Boundary for the entire application.
 * Catches unhandled errors and displays a full-page fallback.
 */
class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console in development
    console.error('Application error:', error, errorInfo)

    // In production, you would send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-8"
          style={{
            backgroundColor: '#4a4a57',
            color: '#f5cdb4',
          }}
        >
          <div className="max-w-md text-center">
            <div className="text-4xl mb-6 font-mono" style={{ color: '#ee5760' }}>
              Something went wrong
            </div>

            <div className="text-sm mb-8 font-mono" style={{ color: '#8b7d8e' }}>
              An unexpected error occurred. Please try refreshing the page.
            </div>

            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div
                className="text-xs mb-8 p-4 font-mono text-left overflow-auto max-h-40"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  color: '#ffcb51',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-3 font-mono text-sm transition-opacity"
                style={{
                  backgroundColor: '#97d8c0',
                  color: '#4a4a57',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                Refresh Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 font-mono text-sm transition-opacity"
                style={{
                  backgroundColor: 'transparent',
                  color: '#97d8c0',
                  border: '1px solid #97d8c0',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary
