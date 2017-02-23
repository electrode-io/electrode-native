import ernSupport from '@walmart/ern-util-dev';

describe('commands/cauldron', function () {

    this.timeout(100000);

    const {
        runBefore,
        runAfter,
        ernTest, fail
    } = ernSupport(__dirname);

    before(runBefore);

    it(`cauldron`, ernTest().then(fail, function ({err, stdout, stderr}) {
        /cauldron needs a command/.test(stderr);
    }));
    after(runAfter);


});
