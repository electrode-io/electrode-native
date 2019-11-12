import {electrodeBridge} from 'react-native-electrode-bridge';

import SystemTestEventEvents from './SystemTestEventEvents';

const EVENTS = new SystemTestEventEvents(electrodeBridge);

export function events() {
  return EVENTS;
}

export default {events};
