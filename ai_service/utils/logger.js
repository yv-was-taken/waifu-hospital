/**
 * Basic logger utility for the AI service
 */
class Logger {
  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {Object} data - Optional data to include
   */
  info(message, data = null) {
    this.log('INFO', message, data);
  }

  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {Error|Object} error - Error object or data
   */
  error(message, error = null) {
    this.log('ERROR', message, error);
  }

  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {Object} data - Optional data to include
   */
  warn(message, data = null) {
    this.log('WARN', message, data);
  }

  /**
   * Log a debug message (only in development)
   * @param {string} message - Message to log
   * @param {Object} data - Optional data to include
   */
  debug(message, data = null) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('DEBUG', message, data);
    }
  }

  /**
   * Format and output a log message
   * @private
   * @param {string} level - Log level
   * @param {string} message - Message to log
   * @param {Object} data - Optional data to include
   */
  log(level, message, data) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (data instanceof Error) {
      console.log(formattedMessage);
      console.error(data);
    } else if (data) {
      // For security, don't log OpenAI API key if present
      const sanitizedData = { ...data };
      if (sanitizedData.apiKey) {
        sanitizedData.apiKey = '[REDACTED]';
      }
      console.log(formattedMessage, sanitizedData);
    } else {
      console.log(formattedMessage);
    }
  }
}

module.exports = new Logger();