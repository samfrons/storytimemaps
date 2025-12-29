/**
 * Structured logging service for consistent application logging.
 * Provides typed logging methods with optional structured data.
 *
 * In development: Logs to console with formatting
 * In production: Can be extended to send logs to external services
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogData {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: LogData
}

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Format log entry for console output
 */
function formatForConsole(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
  return `${prefix} ${entry.message}`
}

/**
 * Create a log entry with timestamp
 */
function createLogEntry(level: LogLevel, message: string, data?: LogData): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    data,
  }
}

/**
 * Output log to appropriate destination
 */
function outputLog(entry: LogEntry): void {
  const formatted = formatForConsole(entry)

  switch (entry.level) {
    case 'debug':
      if (isDevelopment) {
        console.debug(formatted, entry.data || '')
      }
      break
    case 'info':
      console.info(formatted, entry.data || '')
      break
    case 'warn':
      console.warn(formatted, entry.data || '')
      break
    case 'error':
      console.error(formatted, entry.data || '')
      break
  }

  // In production, could send to external service:
  // if (!isDevelopment && entry.level === 'error') {
  //   sendToErrorTracking(entry);
  // }
}

/**
 * Structured logger for the application
 */
export const logger = {
  /**
   * Debug level logging - only shown in development
   */
  debug(message: string, data?: LogData): void {
    const entry = createLogEntry('debug', message, data)
    outputLog(entry)
  },

  /**
   * Info level logging - general information
   */
  info(message: string, data?: LogData): void {
    const entry = createLogEntry('info', message, data)
    outputLog(entry)
  },

  /**
   * Warning level logging - potential issues
   */
  warn(message: string, data?: LogData): void {
    const entry = createLogEntry('warn', message, data)
    outputLog(entry)
  },

  /**
   * Error level logging - errors and exceptions
   */
  error(message: string, err?: Error | unknown, data?: LogData): void {
    const errorData: LogData = { ...data }

    if (err instanceof Error) {
      errorData.errorMessage = err.message
      errorData.errorStack = err.stack
      errorData.errorName = err.name
    } else if (err !== undefined) {
      errorData.error = String(err)
    }

    const entry = createLogEntry('error', message, errorData)
    outputLog(entry)
  },

  /**
   * Create a child logger with a prefix
   */
  child(prefix: string) {
    return {
      debug: (message: string, data?: LogData) => logger.debug(`[${prefix}] ${message}`, data),
      info: (message: string, data?: LogData) => logger.info(`[${prefix}] ${message}`, data),
      warn: (message: string, data?: LogData) => logger.warn(`[${prefix}] ${message}`, data),
      error: (message: string, err?: Error | unknown, data?: LogData) =>
        logger.error(`[${prefix}] ${message}`, err, data),
    }
  },
}

export default logger
