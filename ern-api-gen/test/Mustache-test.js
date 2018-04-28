import Mustache from '../src/java/Mustache'
import { expect } from 'chai'
const RENDER = 'render:'

function mustache(data, out) {
  return function() {
    const { title } = this.test
    const template = title.substring(title.indexOf(RENDER) + RENDER.length + 1)
    const str = Mustache.compiler()
      .compile(template)
      .execute(data)
    expect(str, template).to.eql(out)
  }
}
describe('Mustache', function() {
  it('should render 1, 2, 3', function() {
    const out = Mustache.compiler()
      .compile(`{{#arr}}{{.}}{{^-last}}, {{/-last}}{{/arr}}`)
      .execute({
        arr: [1, 2, 3],
        other: 'ef',
      })
    expect(out).to.eql(`1, 2, 3`)
  })
  it(
    'should render: {{#arr.+isMatch}}{{value}}{{/arr.+isMatch}}',
    mustache(
      {
        arr: [
          {
            isMatch: true,
            value: 'a',
          },
          {
            isMatch: false,
            value: 'c',
          },
          {
            isMatch: true,
            value: 'c',
          },
        ],
        other: 'ef',
      },
      'ac'
    )
  )
  it(
    'should render: {{#arr.b}}{{.}}{{/arr.b}}',
    mustache(
      {
        arr: [
          {
            b: 'h',
          },
          {
            b: 'e',
          },
        ],
        other: 'ef',
      },
      'he'
    )
  )
  it(
    'should render: {{#arr.b-isMatch}}{{c}}{{/arr.b-isMatch}}',
    mustache(
      {
        arr: [
          {
            b: {
              c: 'h',
            },
          },
          {
            b: {
              c: 'o',
              isMatch: true,
            },
          },
          {
            b: {
              c: 'e',
            },
          },
        ],
        other: 'ef',
      },
      'he'
    )
  )
  it(
    'should render: {{#arr}}{{b-c}}{{/arr}}',
    mustache(
      {
        arr: [
          {
            'b-c': 'h',
          },
          {
            'b-c': 'e',
          },
        ],
        other: 'ef',
      },
      'he'
    )
  )

  it(
    'should deep render: {{#arr.b.c}}{{.}}{{/arr.b.c}}',
    mustache(
      {
        arr: [
          {
            b: {
              c: 'h',
            },
          },
          {
            b: {
              c: 'e',
            },
          },
        ],
        other: 'ef',
      },
      'he'
    )
  )
  it(
    'should deep missing, render: {{#arr.b.c}}{{.}}{{/arr.b.c}}',
    mustache(
      {
        arr: [
          {
            b: {
              c: 'h',
            },
          },
          {
            b: {
              e: 'o',
            },
          },
          {
            b: {
              c: 'e',
            },
          },
        ],
        other: 'ef',
      },
      'he'
    )
  )
  it(
    'shound render: {{#test.0}}hello{{/test.0}}',
    mustache(
      {
        test: [1, 2, 3],
      },
      'hello'
    )
  )
  it(
    'shound render: me{{#test.0}}hello{{/test.0}}',
    mustache(
      {
        test: [],
      },
      'me'
    )
  )
  it(
    'shound render: {{#apiInfo}}{{#apis.0}}{{#operations}}{{#operation.0}}hello{{/operation.0}}{{/operations}}{{/apis.0}}{{/apiInfo}}',
    mustache(
      {
        apiInfo: {
          apis: [
            {
              operations: [],
            },
          ],
        },
      },
      ''
    )
  )
  it(
    'shound with data render: {{#apiInfo}}{{#apis.0}}{{#operations}}{{#operation.0}}hello{{/operation.0}}{{/operations}}{{/apis.0}}{{/apiInfo}}',
    mustache(
      {
        apiInfo: {
          apis: [
            {
              operations: ['me'],
            },
          ],
        },
      },
      ''
    )
  )

  it(
    "should render: {{#imports}}import {{import}} from '../{{#modelPackage}}{{modelPackage}}/{{/modelPackage}}{{import}}';{{/imports}}",
    mustache(
      {
        imports: [
          {
            import: 'Hello',
          },
        ],
        modelPackage: 'model',
      },
      "import Hello from '../model/Hello';"
    )
  )
})
