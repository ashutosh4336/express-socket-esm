import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rTracer from 'cls-rtracer';
import { isPlainObject } from 'is-plain-object';
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf } = format;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 1. Please replace "microServiceName" to appropriate micro Service Name.
 * 2. Set the environment.
 * 3. Install cls-rtracer, winston, winston-daily-rotate-file, and is-plain-object npm package
 */
const serviceName = process.env.SERVICE_NAME || 'MicroServiceName';

const excludedKeys =
  process.env.NODE_ENV !== 'development'
    ? [
        'client_secret',
        'secret',
        'password',
        'work_email',
        'first_name',
        'last_name',
        'email',
        'email_id',
        'userInput',
        'pwd',
        'new_pwd',
        'confirmed_pwd',
        'old_pwd',
        'email',
        'alternate_email',
        'first_name',
        'middle_name',
        'last_name',
        'full_name',
        'primary_mobile',
        'address',
        'address2',
        'zip_code',
        'city',
        'state',
        'profile_image_dp',
        'name',
        'user_input',
        'em',
        'user_email',
        'auth_email_id',
        'otp',
        'resetlink',
      ]
    : [];

const logFormat = printf((info) => {
  const rid = rTracer.id();

  let message = deepRegexReplace(info.message);

  message = isPlainObject(message) ? [message] : message;
  let final_message = [];

  for (var i = 0; i < message.length; i++) {
    let item =
      typeof message[i] == 'object' ? JSON.stringify(message[i]) : message[i];
    final_message.push(item);
  }
  final_message = final_message.join(' | ');
  return rid
    ? `${info.timestamp} [${info.service}] ${info.level} [request-id:${rid}]: ${final_message}`
    : `${info.timestamp} [${info.service}] ${info.level} [request-id:0000]: ${final_message}`;
});

const deepRegexReplace = (value, single_key = '') => {
  try {
    const parsed_value = JSON.parse(value);
    if (typeof parsed_value === 'object') {
      value = parsed_value;
    }
  } catch (e) {}
  try {
    if (typeof value === 'undefined' || typeof excludedKeys === 'undefined')
      return value || '';
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i = i + 1) {
        value[i] = deepRegexReplace(value[i]);
      }
      return value;
    } else if (isPlainObject(value)) {
      for (let key in value) {
        if (value.hasOwnProperty(key)) {
          value[key] = deepRegexReplace(value[key], key);
        }
      }
      return value;
    } else {
      if (excludedKeys.includes(single_key.toLowerCase())) return '[REDACTED]';
      else return value;
    }
  } catch (e) {
    console.error('Logger deepRegexReplace', e);
    return value;
  }
};

const winstonLogger = createLogger({
  format: combine(
    format((info) => {
      info.level = info.level.toUpperCase();
      return info;
    })(),
    timestamp(),
    logFormat
  ),
  level: 'debug',
  transports: [
    new transports.DailyRotateFile({
      name: 'file',
      datePattern: 'YYYY-MM-DD',
      filename: path.join(__dirname, '../logs', `${serviceName}_%DATE%.log`), // Set the micro service name
      // zippedArchive: true,
      maxFiles: '14d',
      maxSize: '20m',
      timestamp: true,
    }),
    new transports.Console({
      format: format.combine(format.colorize(), logFormat),
    }),
  ],
  defaultMeta: { service: serviceName }, // Set the micro service name
});

const wrapper = (original) => {
  return (...args) => {
    let _transformedArgs = [];

    args.forEach((arg) => {
      if (typeof arg == 'object') {
        if (arg instanceof Error) {
          _transformedArgs.push(arg.stack);
        } else {
          _transformedArgs.push(JSON.stringify(arg));
        }
      } else {
        _transformedArgs.push(arg);
      }
    });
    return original(_transformedArgs);
  };
};

winstonLogger.error = wrapper(winstonLogger.error);
winstonLogger.warn = wrapper(winstonLogger.warn);
winstonLogger.info = wrapper(winstonLogger.info);
winstonLogger.debug = wrapper(winstonLogger.debug);

const appLogger = {
  log: function (level, message, ...args) {
    winstonLogger.log(level, message, ...args);
  },
  error: function (message, ...args) {
    winstonLogger.error(message, ...args);
  },
  warn: function (message, ...args) {
    winstonLogger.warn(message, ...args);
  },
  info: function (message, ...args) {
    winstonLogger.info(message, ...args);
  },
  debug: function (message, ...args) {
    winstonLogger.debug(message, ...args);
  },
};

export default appLogger;
