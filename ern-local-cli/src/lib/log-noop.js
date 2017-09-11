// Noop logger
// This is used by CLI entry file before any other imports
// so that we don't end up with some imports executing some
// log calls while log is not yet defined
// This is not the ideal approach, but is just temporary
// precautionary approach.
global.log = {
  debug: () => {},
  trace: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
}
