import v000to100 from './0.0.0-1.0.0';
import v100to200 from './1.0.0-2.0.0';
import v200to300 from './2.0.0-3.0.0';

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
  {
    from: '2.0.0',
    to: '3.0.0',
    upgrade: v200to300,
  },
];

export default scripts;
