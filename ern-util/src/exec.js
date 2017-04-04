import ChildProcess from 'child_process';

export const IMPLEMENTATION = {
    exec: ChildProcess.exec
};


export function exec(...args) {
    return IMPLEMENTATION.exec(...args);
}

export default exec;