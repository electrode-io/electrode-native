import {electrodeBridge} from 'react-native-electrode-bridge';

import TestEventObjectParamEvents from './TestEventObjectParamEvents';

const EVENTS = new TestEventObjectParamEvents(electrodeBridge);

export function events() {
  return EVENTS;
}

export default {events};
