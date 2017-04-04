export const LEVELS = {
    EMERGENCY: 0,
    ALERT: 1,
    CRITICAL: 2,
    ERROR: 3,
    WARN: 4,
    NOTICE: 5,
    INFO: 6,
    DEBUG: 7
};

export const CONFIG = {
    LEVEL: LEVELS.DEBUG,
    console
};
export function makeLogger(pre = '') {
    const prefix = pre ? `${pre}:` : '';
    return {
        trace(e){
            CONFIG.console.log(prefix, 'tracing');
            CONFIG.console.trace(e);
        },
        log(...args){
            CONFIG.console.log(prefix, ...args);
        },
        emergency(...args){
            if (CONFIG.LEVEL <= LEVELS.ALERT)
                CONFIG.console.error(prefix, ...args);
        },
        alert(...args){
            if (CONFIG.LEVEL <= LEVELS.ALERT)
                CONFIG.console.error(prefix, ...args);
        },
        critical(...args){
            if (CONFIG.LEVEL <= LEVELS.CRITICAL)
                CONFIG.console.error(prefix, ...args);
        },
        error(...args){
            if (CONFIG.LEVEL <= LEVELS.ERROR)
                CONFIG.console.error(prefix, ...args);
        },
        warn(...args){
            if (CONFIG.LEVEL <= LEVELS.WARN)
                CONFIG.console.error(prefix, ...args);
        },
        notice(...args){
            if (CONFIG.LEVEL <= LEVELS.NOTICE)
                CONFIG.console.log(prefix, ...args);
        },
        info(...args){
            if (CONFIG.LEVEL <= LEVELS.INFO)
                CONFIG.console.log(prefix, ...args);
        },
        debug(...args){
            if (CONFIG.LEVEL <= LEVELS.DEBUG)
                CONFIG.console.log(prefix, ...args);
        }
    }
}

export default makeLogger();
