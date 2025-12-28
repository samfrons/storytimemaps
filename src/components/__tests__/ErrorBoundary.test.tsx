import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary, { ErrorFallback } from '../ErrorBoundary'

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests since we expect errors
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = originalError
  })

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('should render fallback UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('should render custom component name in fallback', () => {
    render(
      <ErrorBoundary componentName="TestComponent">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error in TestComponent')).toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom fallback UI</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom fallback UI')).toBeInTheDocument()
  })

  it('should call onError callback when an error occurs', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    )
  })

  it('should reset error state when Try Again is clicked', () => {
    // Create a component that can toggle error state
    let shouldThrow = true
    const ToggleError = () => {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div>Success after retry</div>
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ToggleError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Change the state before clicking retry
    shouldThrow = false

    // Click the retry button
    fireEvent.click(screen.getByText('Try Again'))

    // Re-render to trigger the component to render again
    rerender(
      <ErrorBoundary>
        <ToggleError />
      </ErrorBoundary>
    )

    // Now it should show the success message
    expect(screen.getByText('Success after retry')).toBeInTheDocument()
  })
})

describe('ErrorFallback', () => {
  it('should display error message', () => {
    const error = new Error('Test error message')
    const onRetry = jest.fn()

    render(<ErrorFallback error={error} onRetry={onRetry} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('should display component name when provided', () => {
    const onRetry = jest.fn()

    render(<ErrorFallback error={null} onRetry={onRetry} componentName="MapView" />)

    expect(screen.getByText('Error in MapView')).toBeInTheDocument()
  })

  it('should call onRetry when Try Again button is clicked', () => {
    const onRetry = jest.fn()

    render(<ErrorFallback error={null} onRetry={onRetry} />)

    fireEvent.click(screen.getByText('Try Again'))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
