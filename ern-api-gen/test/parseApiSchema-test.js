import parseApiSchema from '../lib/parseApiSchema';
import {expect} from 'chai';
import fs from 'fs';
import path from 'path';

function makeTest(schema, match) {
    return () => {
        expect(parseApiSchema(schema, 'parseApiSchema-test')).to.eql(match);
    };
}
function makeTestWithFilename(schema, match, filename) {
    return () => {
        expect(parseApiSchema(schema, filename)).to.eql(match);
    };
}

function makeTestByName(match) {
    return function () {
        return makeTest(this.test.title, match)();
    };
}
function makeError(schema, message) {
    return () => {
        let error = true;
        try {
            parseApiSchema(schema, 'parseApiSchema-test');
            error = false;
        } catch (e) {
            expect(e.message).to.eql(message);
        }
        expect(error, message).to.eql(true);
    }
}

describe('parseApiSchema', function () {
    describe('meta: namespace|apiName|apiVersion|npmScope|modelPath', function () {
        it('should parse namespace', makeTest(`namespace abc   `, {
            "events": [],
            "namespace": "abc",
            "requests": []
        }));
        it('should parse apiVersion', makeTest(`apiVersion 1.0.0
//
namespace abc //this is a comment
`, {
            "events": [],
            "namespace": "abc",

            "apiVersion": "1.0.0",
            "requests": []
        }));


        it('should parse apiVersion amd apiName', makeTest(`apiVersion 1.0.0
npmScope stuff
namespace abc //this is a comment
modelPath ../../.../stfuasd
`, {
            "events": [],
            "namespace": "abc",
            "npmScope": "stuff",
            "apiVersion": "1.0.0",
            "requests": [],
            "modelPath": "../../.../stfuasd"
        }));
    });

    describe('invalid syntax', function () {
        it('should throw an error on invalid syntax line 0', makeError(`undefined`, `unknown syntax 'undefined' at line 0 in parseApiSchema-test`))
        it('should throw an error on invalid syntax line 2', makeError(
            `
//a comment here
a command there //a comment there

//a comment everywhere

`,

            `unknown syntax 'a command there ' at line 2 in parseApiSchema-test`))

    });

    describe('documented statements', function () {
        it('event weatherUpdatedAtPosition(position: LatLng)', makeTestByName({
            "events": [
                {
                    "name": "weatherUpdatedAtPosition",
                    "payload": {
                        "name": "position",
                        "type": "LatLng"
                    }
                }
            ],
            "requests": []
        }));

        it(' event weatherUpdated', makeTestByName({
            "events": [
                {
                    "name": "weatherUpdated"
                }],
            requests: []
        }));

        it(`request refreshWeather()`, makeTestByName({
            "events": [],
            "requests": [
                {
                    "name": "refreshWeather"
                }
            ]
        }));

        it('request refreshWeatherFor(location: String)', makeTestByName({
            events: [],
            requests: [
                {
                    "name": "refreshWeatherFor",
                    "payload": {
                        "type": "String",
                        "name": "location"
                    }
                }
            ]
        }));

        it('request getTemperatureFor(location: String) : Integer', makeTestByName({
            events: [],
            requests: [{
                "name": "getTemperatureFor",
                "payload": {
                    "type": "String",
                    "name": "location"
                },
                "respPayloadType": "Integer"
            }]
        }));

        it('request getCurrentTemperature() : Integer', makeTestByName({
            "events": [],
            "requests": [
                {
                    "name": "getCurrentTemperature",
                    "respPayloadType": "Integer"
                }
            ]
        }));
    });
    const fixtures = path.join(__dirname, 'fixtures')
    fs.readdirSync(fixtures).filter(f => /\.apischema$/.test(f)).forEach(function (f) {
        const file = path.join(fixtures, f);
        let result;
        try {
            result = JSON.parse(fs.readFileSync(file + '.json', 'utf8'));
        } catch (e) {
            throw new Error(`Error parsing ${file}.json ${e.message}`);
        }
        const source = fs.readFileSync(file, 'utf8');
        it(`should parse ${f}`, makeTestWithFilename(source, result, file));


    })
});
