import ernSupport from './support/ern';


describe("commands/generate/api", function () {

    this.timeout(60000);
    const {
        runBefore,
        runAfter,
        ernTest,
        json,
        ern,
        exists,
        gradle,
        compare,
    } = ernSupport();

    before(runBefore);
    after(runAfter);
    it('generate api init initapitest', ernTest()
        .then(json('react-native-initapitest-api/package.json', {name: 'react-native-initapitest-api'}))
        .then(ern(`generate api regen`, {cwd: 'react-native-initapitest-api'}))
        .then(compare('react-native-initapitest-api', 'fixtures/react-native-initapitest-api'))
        .then(gradle('react-native-initapitest-api', 'build')));

    it(`generate api init withargs  --scope walmartTest --apiVersion=2.0.0 --apiAuthor=tester`, ernTest()
        .then(json('react-native-withargs-api/package.json', {
            name: '@walmartTest/react-native-withargs-api',
            author: "tester",
            version: "2.0.0"
        }))
        .then(ern(`generate api regen`, {cwd: 'react-native-withargs-api'}))
        .then(compare('react-native-withargs-api', 'fixtures/react-native-withargs-api'))
        .then(gradle('react-native-withargs-api', 'build')));
});
