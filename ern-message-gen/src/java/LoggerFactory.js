import {makeLogger} from './Logger';
const LOGGER_CACHE = {};
export default ({
    getLogger(clz){
        if (!clz) {
            clz = '';
        } else {
            clz = clz.displayName || clz.name || clz;
        }
        return (LOGGER_CACHE[clz] || (LOGGER_CACHE[clz] = makeLogger(clz)));
    }
})
