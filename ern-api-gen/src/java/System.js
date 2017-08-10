

export default class System {
    static  properties = {};
    /**
     * Handle -Daasdasd=astasdsad
     * and process.env;
     * arguments take precidence?
     * @param key
     * @returns {*}
     */
    static getProperty(key) {
        const {properties} = System;
        if (key in properties) return properties[key];
        const starts = `-D${key}`;
        const args = process.argv.slice(2);
        for (let i = 0, l = args.length; i < l; i++) {
            const arg = args[i];
            if (arg == starts) {
                return (properties[key] = args[++i]);
            }
            if (arg.startsWith(starts + '=')) {
                return (properties[key] = arg.substring(starts.length + 1));
            }
        }
        return process.env[key];
    }

    static setProperty(key, value) {
        const {properties} = System;
        properties[key] = value;
    }
}
