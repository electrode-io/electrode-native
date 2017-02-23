import parseApiSchema from '../src/parseApiSchema';
import {expect} from 'chai';
import fs from 'fs';
import path from 'path';

const fixtures = path.join.bind(path, __dirname, 'fixtures');
const apiFixtures = fs.readdirSync(fixtures()).filter(f => /\.apischema$/.test(f));

function readJSON(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        throw new Error(`Error parsing ${file} ${e.message}`);
    }
}

function makeTest(schema, match) {
    return makeTestWithFilename(schema, match, 'parseApiSchema-test.js');
}
function makeTestWithFilename(schema, match, filename) {
    return () => {
        const res = parseApiSchema(schema, filename)
        expect(res).to.eql(match);
        return Promise.resolve(res);
    };
}

function titleTest(match) {
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
        it(`namespace abc   `, titleTest({
            "events": [],
            "namespace": "abc",
            "requests": []
        }));
        it(`
//
namespace abc //this is a comment
`, titleTest({
            "events": [],
            "namespace": "abc",
            "requests": []
        }));


        it(`
namespace abc //this is a comment
`, titleTest({
            "events": [],
            "namespace": "abc",
            "requests": []
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
        it('event weatherUpdatedAtPosition(position: LatLng)', titleTest({
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

        it(' event weatherUpdated', titleTest({
            "events": [
                {
                    "name": "weatherUpdated"
                }],
            "requests": []
        }));

        it(`request refreshWeather()`, titleTest({
            "events": [],
            "requests": [
                {
                    "name": "refreshWeather"
                }
            ]
        }));

        it('request refreshWeatherFor(location: String)', titleTest({
            "events": [],
            "requests": [
                {
                    "name": "refreshWeatherFor",
                    "payload": {
                        "type": "String",
                        "name": "location"
                    }
                }
            ]
        }));

        it('request getTemperatureFor(location: String) : Integer', titleTest({
            "events": [],
            "requests": [{
                "name": "getTemperatureFor",
                "payload": {
                    "type": "String",
                    "name": "location"
                },
                "respPayloadType": "Integer"
            }]
        }));

        it('request getCurrentTemperature() : Integer', titleTest({
            "events": [],
            "requests": [
                {
                    "name": "getCurrentTemperature",
                    "respPayloadType": "Integer"
                }
            ]
        }));
    });

    describe('api schema fixtures', function () {
        apiFixtures.forEach(f => {
            const file = fixtures(f);
            const result = readJSON(`${file}.json`);
            const source = fs.readFileSync(file, 'utf8');
            it(`should parse ${f}`, makeTestWithFilename(source, result, file));
        });
    });
});
