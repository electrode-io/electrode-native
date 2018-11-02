import v000to100 from './0.0.0-1.0.0'
import v100to200 from './1.0.0-2.0.0'

const scripts = [
  {
    from: '0.0.0',
    to: '1.0.0',
    upgrade: v000to100,
  },
  {
    from: '1.0.0',
    to: '2.0.0',
    upgrade: v100to200,
  },
]

export default scripts
