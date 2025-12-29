import '@testing-library/jest-dom'

// Mock window.matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock fetch globally
global.fetch = jest.fn()

// Suppress console errors during tests (optional)
// Uncomment if you want to suppress specific errors
// const originalError = console.error
// beforeAll(() => {
//   console.error = (...args: unknown[]) => {
//     if (args[0]?.toString().includes('Warning:')) return
//     originalError.call(console, ...args)
//   }
// })
// afterAll(() => {
//   console.error = originalError
// })
