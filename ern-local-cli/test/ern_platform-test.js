import ernSupport from './support/ern';
import {assert} from 'chai';

const {
    runBefore,
    runAfter,
    ernTest,
    json,
    ern,
    exists,
    gradle,
    compare,
    fail
} = ernSupport();


describe('commands/platform', function () {
    before(runBefore);
    after(runAfter);
    this.timeout(100000);

    it(`platform`, ernTest().then(fail, function ({err, stdout, stderr}) {
        assert(/platform needs a command/.test(stderr), `has a command`);
    }));

});