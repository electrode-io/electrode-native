import ernSupport from './support/ern';
const {
    runBefore,
    runAfter,
    ernTest,
    ern,
    exists,
    gradle,
    compare,
} = ernSupport();

describe('commands/miniapp', function () {
    this.timeout(100000);

    before(runBefore);
    after(runAfter);
    it(`miniapp init genapp`, ernTest()
        .then(exists('genapp/package.json'))
        .then(compare('genapp', 'fixtures/init_genapp'))
    );
});
