import { expect } from 'chai';
import { parseArgValue } from '../src/lib/parseArgValue';
import path from 'path';

describe('parseArgValue', () => {
  it('should return the passed value if value is a number', async () => {
    expect(await parseArgValue(5)).eql(5);
  });

  it('should return true if the value is "true"', async () => {
    expect(await parseArgValue('true')).true;
  });

  it('should return false if the value is "false"', async () => {
    expect(await parseArgValue('false')).false;
  });

  it('should return the passed value if value is a string', async () => {
    expect(await parseArgValue('toto')).eql('toto');
  });

  it('should return parsed json if value is a json string', async () => {
    expect(await parseArgValue('{"key": "value"}')).eql({
      key: 'value',
    });
  });

  it('should return parsed json if value is a json file', async () => {
    expect(
      await parseArgValue(path.resolve(__dirname, 'fixtures', 'dummy.json')),
    ).eql({
      key: 'value',
    });
  });
});
