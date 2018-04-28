// Utility function to be used to flag params as required using ES6 default
// argument mecanism.
// For example :
// function foo(param1 = required('param1'), param2)
export default function required(name: string) {
  throw new Error(`${name} is required`)
}
