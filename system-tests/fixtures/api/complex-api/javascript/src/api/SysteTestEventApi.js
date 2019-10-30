import { electrodeBridge } from 'react-native-electrode-bridge';
import SysteTestEventEvents from './SysteTestEventEvents';


const EVENTS = new SysteTestEventEvents(electrodeBridge);

export function events() {
  return EVENTS;
}


export default ({events});

