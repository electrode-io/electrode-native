import {runAndroid} from '../src/android';
import {expect} from 'chai';
import {IMPLEMENTATION} from '../src/exec';
/*
const DOWN = '\x1B\x5B\x42';
const UP = '\x1B\x5B\x41';
const ENTER = '\x0D';
*/


const oexec = IMPLEMENTATION.exec;


describe('android', function () {
    afterEach(function () {
        IMPLEMENTATION.exec = oexec;
    });

    it('runAndroid', async() => {
        IMPLEMENTATION.exec = function (cmd, options, done) {
            if (done == null && typeof options === 'function') {
                done = options;
            }
            if (/\/adb devices/.test(cmd)) {
                return done(null, `List of devices attached
`);
            }


            if (/\/emulator -list-avds/.test(cmd)) {
                //bddStdin(bddStdin.keys.down, bddStdin.keys.down, bddStdin.keys.down, '\n');
                return done(null, `Android_ARMv7a
Android_Accelerated_x86
Nexus_6_API_23
react-native`);
            }

            if(/\/emulator -avd/.test(cmd)){

                return done(null, `ready`);
            }
            if (/\/adb wait-for-device shell getprop init.svc.bootanim/.test(cmd)){
                return done(null, `ready`);
            }
            console.log(`not sure : ${cmd}`);
            done(1, null, `Not Implemeted`);
        };
        const ret = await runAndroid({});
    })


});