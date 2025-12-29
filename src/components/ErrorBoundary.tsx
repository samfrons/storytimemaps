'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  componentName?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component for catching JavaScript errors in child components.
 * Wraps components that may crash (WebGL, async data loading, etc.)
 * and displays a fallback UI instead of crashing the entire app.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          componentName={this.props.componentName}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  onRetry: () => void
  componentName?: string
}

/**
 * Default fallback UI for error states.
 * Displays a clean error message with retry option.
 */
function ErrorFallback({ error, onRetry, componentName }: ErrorFallbackProps): ReactNode {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 min-h-[200px]"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="font-mono text-lg mb-4" style={{ color: 'var(--danger)' }}>
        {componentName ? `Error in ${componentName}` : 'Something went wrong'}
      </div>

      {error && (
        <div
          className="font-mono text-sm mb-4 max-w-md text-center"
          style={{ color: 'var(--foreground-muted)' }}
        >
          {error.message}
        </div>
      )}

      <button
        onClick={onRetry}
        className="px-4 py-2 font-mono text-sm transition-colors"
        style={{
          backgroundColor: 'var(--primary)',
          color: 'var(--background)',
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
        Try Again
      </button>
    </div>
  )
}

export { ErrorBoundary, ErrorFallback }
export default ErrorBoundary
