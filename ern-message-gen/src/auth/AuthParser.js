import  AuthorizationValue from '../models/auth/AuthorizationValue';
import LoggerFactory from "../java/LoggerFactory";
import {isNotEmpty} from '../java/StringUtils';
import StringBuilder from '../java/StringBuilder';
import {URLDecoder, URLEncoder} from '../java/encoders';

export default class AuthParser {

    static parse(urlEncodedAuthStr) {
        const auths = [];
        if (isNotEmpty(urlEncodedAuthStr)) {
            for (const part of urlEncodedAuthStr.split(",")) {
                let kvPair = part.split(":", 2);
                if (kvPair.length === 2) {
                    auths.add(new AuthorizationValue(URLDecoder.decode(kvPair[0]), URLDecoder.decode(kvPair[1]), "header"));
                }
            }
        }
        return auths;
    }

    static reconstruct(authorizationValueList) {
        if (authorizationValueList != null) {
            let b = new StringBuilder();
            for (const v of authorizationValueList) {
                try {
                    if (b.toString().length > 0) {
                        b.append(",");
                    }
                    b.append(URLEncoder.encode(v.getKeyName(), "UTF-8")).append(":").append(URLEncoder.encode(v.getValue(), "UTF-8"));
                }
                catch (e) {
                    Log.trace(e);
                }

            }
            return b.toString();
        }

        return null;
    }
}
const Log = LoggerFactory.getLogger(AuthParser);
