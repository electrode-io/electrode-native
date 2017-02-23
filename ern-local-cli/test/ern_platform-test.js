import ernSupport from '@walmart/ern-util-dev';
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
    } = ernSupport(__dirname);

    before(runBefore);
    after(runAfter);

    it(`platform`, ernTest().then(fail, function ({err, stdout, stderr}) {
        assert(/platform needs a command/.test(stderr), `has a command`);
    }));

});
