import ernSupport from './support/ern';
import {assert} from 'chai';


describe('commands/platform', function () {
    this.timeout(100000);

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

    before(runBefore);
    after(runAfter);

    it(`platform`, ernTest().then(fail, function ({err, stdout, stderr}) {
        assert(/platform needs a command/.test(stderr), `has a command`);
    }));

});
