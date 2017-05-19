const log = require('console-log-level')({
  prefix (level) {
    return '[ern-api-gen]'
  },
  level: 'info'
})

export default log
