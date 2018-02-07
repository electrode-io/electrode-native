import { electrodeBridge } from 'react-native-electrode-bridge';
import WalmartItemRequests from './WalmartItemRequests';
import WalmartItemEvents from './WalmartItemEvents';

const REQUESTS = new WalmartItemRequests(electrodeBridge);

export function requests() {
    return REQUESTS;
}

const EVENTS = new WalmartItemEvents(electrodeBridge);

export function events() {
  return EVENTS;
}



export default ({requests, events});
