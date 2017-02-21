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
    before(runBefore);
    after(runAfter);
    this.timeout(50000);
    it(`miniapp init genapp`, ernTest()
        .then(exists('genapp/package.json'))
        .then(compare('genapp', 'fixtures/init_genapp'))
    );
});
