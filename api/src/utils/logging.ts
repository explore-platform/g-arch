
export type LogOptions = {
}

export const log = {
    error: (message: string, options?: LogOptions) => _log('error', message, options),
    warn: (message: string, options?: LogOptions) => _log('warn', message, options),
    info: (message: string, options?: LogOptions) => _log('info', message, options),
    debug: (message: string, options?: LogOptions) => _log('debug', message, options),
    log: (message: string, options?: LogOptions) => _log('log', message, options),
}

const _log = (
    type: 'error'|'log'|'warn'|'info'|'debug', 
    message: string,
    options: LogOptions
) =>{
    return console[type](message);
}