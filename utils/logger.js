import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import process from 'node:process';
import path from 'node:path';
import winston from 'winston';

const levels = Object.freeze({ error: 0, warn: 1, info: 2, debug: 3 });
const supportedLevels = Object.freeze(['DEBUG', 'INFO', 'WARN', 'ERROR']);
const configuredLevel = (process.env.LOG_LEVEL ?? 'INFO').toUpperCase();

if (!supportedLevels.includes(configuredLevel)) {
  throw new Error(`Invalid LOG_LEVEL "${configuredLevel}". Use DEBUG, INFO, WARN, or ERROR.`);
}

const workerId = process.env.CUCUMBER_WORKER_ID ?? 'main';
const logBuffer = [];
const maxBufferedLogs = 300;

/**
 * Keep a bounded copy of recent formatted logs for failed-scenario attachments.
 *
 * @param {string} line Formatted log line.
 * @returns {string} The line written to the configured transports.
 */
function rememberLog(line) {
  logBuffer.push(line);
  if (logBuffer.length > maxBufferedLogs) {
    logBuffer.shift();
  }
  return line;
}

const transports = [new winston.transports.Console()];
if (process.env.LOG_TO_FILE === 'true') {
  const logDirectory = path.resolve('artifacts', 'logs');
  mkdirSync(logDirectory, { recursive: true });
  transports.push(
    new winston.transports.File({
      filename: path.join(logDirectory, `cucumber-${workerId}-${process.pid}.log`),
    }),
  );
}

const logger = winston.createLogger({
  levels,
  level: configuredLevel.toLowerCase(),
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message }) =>
      rememberLog(
        `${timestamp} [${level.toUpperCase()}] [worker:${workerId} pid:${process.pid}] ${message}`,
      ),
    ),
  ),
  transports,
});

/**
 * Clear logs left by the previous scenario in this Cucumber worker.
 * @returns {void}
 */
logger.clearBuffer = () => {
  logBuffer.length = 0;
};

/**
 * Return recent formatted lines for a failed-scenario attachment.
 * @returns {string[]}
 */
logger.getRecentLogs = () => [...logBuffer];

export { logger };
export default logger;
