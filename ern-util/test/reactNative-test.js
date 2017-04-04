import reactNative from '../src/reactNative';
import {expect} from 'chai';
import {IMPLEMENTATION} from '../src/exec';
const {exec} = IMPLEMENTATION;
reactNative.reactNativeBinaryPath  = 'whatever';
describe('reactNativeInit', function () {
    afterEach(() => {
        IMPLEMENTATION.exec = exec;

    });

    it('should execute', async() => {
        IMPLEMENTATION.exec = (cmd, args, done) => {
            if (done == null && typeof args == 'function') {
                done = args;
            }
            expect(cmd).to.eql('whatever init super --version react-native@0.50.0 --skip-jest');
            done(null, '');
        };
        await reactNative.init('super', '0.50.0');
    });
    it('should not execute directory exists', async() => {
        IMPLEMENTATION.exec = (cmd, args, done) => {
            expect(false).to.be.true;
            done(null, '');
        };
        try {
            await reactNative.init('../ern-util', '0.50.0');
        } catch (e) {
            expect(e).to.exist;
            return;
        }
        expect(false).to.be.true;
    });
    it('should fail', async() => {
        IMPLEMENTATION.exec = (cmd, args, done) => {
            done(1, null, 'I did not works');
        };
        try {
            await reactNative.init('duperpooper', '0.50.0');
        } catch (e) {
            expect(e).to.exist;
            return;
        }
        expect(false).to.be.true;
    });
});