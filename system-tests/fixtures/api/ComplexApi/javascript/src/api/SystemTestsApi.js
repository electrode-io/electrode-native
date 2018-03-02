import { electrodeBridge } from 'react-native-electrode-bridge';
import SystemTestsRequests from './SystemTestsRequests';

const REQUESTS = new SystemTestsRequests(electrodeBridge);

export function requests() {
    return REQUESTS;
}


export default ({requests});


