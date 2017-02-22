import ernSupport from './support/ern';
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



describe('commands/cauldron', function () {
    before(runBefore);
    after(runAfter);
    this.timeout(100000);

    it(`cauldron`, ernTest().then(fail, function ({err, stdout, stderr}) {
        /cauldron needs a command/.test(stderr);
    }));

});