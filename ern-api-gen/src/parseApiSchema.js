/***
 *
 * ==============================================================================
 * Parse an api schema file
 * ==============================================================================
 *
 * Sample Schema file (any construct not part of this schema sample is not
 * currently supported by this version of ern-apigen)
 * -----------------------------------
 *
 * - Event with no payload
 * event weatherUpdated
 *
 * - Event with a primitive type payload
 * event weatherUdpatedAtLocation(location: String)
 *
 *  - Event with complex type payload
 *  event weatherUpdatedAtPosition(position: LatLng)
 *
 *  - Request with no request payload and no response payload
 * request refreshWeather()
 *
 *  - Request with a single request payload and no response payload
 *  request refreshWeatherFor(location: String)
 *
 * - Request with a single request payload and a response payload
 * request getTemperatureFor(location: String) : Integer
 *
 * - Request with no request payload and a response payload
 *  request getCurrentTemperature() : Integer
 *
 * - Request with no request payload an an array response payload
 * request getCurrentTemparatures() : Integer[]
 * -----------------------------------
 */
// Regexes matching events schema statements
const eventWithPayloadRe = /event\s+?(.+)\({1}(.+)\s*:\s*(.+)\s*\){1}/;
const eventWoPayloadRe = /event\s+?([a-zA-Z]+)/;

// Regexes matching requests schema statements

// request without request payload and without response payload
const requestWoReqPWoResP = /request\s+?([a-zA-Z]+)\(\s*\)\s*$/;
// request with a request payload and no response payload
const requestWReqPWoResP = /request\s+?(.+)\({1}(.+)\s*:\s*(.+)\s*\){1}\s*$/;
// request with a request payload and a response payload
const requestWReqPWResP = /request\s+?(.+)\({1}(.+)\s*:\s*(.+)\){1}\s*:\s*(.+)\s*/;
// request with no request payload and a reponse payload
const requestWoReqPWResP = /request\s+?([a-zA-Z]+)\s*\(\s*\)\s*:\s*(.+)\s*/;

const meta = /^\s*(namespace)\s+?(.+?)\s*$/i;

export default function parseApiSchema(schema, fileName) {
    const events = [];
    const requests = [];
    const view = {events, requests};

    // Todo : Quite some duplication going on in the following for block
    // refactor accordingly to minimize code duplication
    let lineNo = -1;
    for (const _line of schema.split('\n')) {
        lineNo++;
        //Remove Comments
        const [line, comment] = _line.split('//', 2);

        //All Comments if line is empty
        if (!line.trim()) {
            //swallow comments
            continue;
        }
        if (meta.test(line)) {
            const mr = meta.exec(line);
            view[mr[1].toLowerCase()] = mr[2];
            continue;
        }
        // Handles statement declaring an event with payload
        // Sample statement :
        //   event weatherUpdatedAtPosition(position: LatLng)
        // Will produce :
        //  {
        //    "name": "weatherUpdatedAtPosition",
        //    "payload": {
        //      "type": "LatLng",
        //      "name": "position"
        //    }
        //  }
        if (eventWithPayloadRe.test(line)) {
            const eventName = eventWithPayloadRe.exec(line)[1];
            const eventPayloadName = eventWithPayloadRe.exec(line)[2];
            let eventPayloadType = eventWithPayloadRe.exec(line)[3];

            //if (isArrayType(eventPayloadType)) {
            //  eventPayloadType = androidObjTypeArrToPrimitiveArr(eventPayloadType);
            //}

            events.push({
                "name": eventName,
                "payload": {
                    "type": eventPayloadType,
                    "name": eventPayloadName
                }
            });
        }
        // Handles statement declaring an event with no payload
        // Sample statement :
        //   event weatherUpdated
        // Will produce :
        //  {
        //    "name": "weatherUpdated"
        //  }
        else if (eventWoPayloadRe.test(line)) {
            const eventName = eventWoPayloadRe.exec(line)[1];
            events.push({
                "name": eventName
            });
        }
        // Handles statement declaring a request with no request payload and
        // no response payload
        // Sample statement :
        //   request refreshWeather()
        // Will produce :
        //  {
        //    "name": "refreshWeather"
        //  }
        else if (requestWoReqPWoResP.test(line)) {
            const requestName = requestWoReqPWoResP.exec(line)[1];
            requests.push({
                "name": requestName
            });
        }
        // Handles statement declaring a request with a single request payload
        // and no response payload
        // Sample statement :
        //   request refreshWeatherFor(location: String)
        // Will produce :
        // {
        //   "name": "refreshWeatherFor",
        //   "payload": {
        //     "type": "String",
        //     "name": "location"
        //   }
        // }
        else if (requestWReqPWoResP.test(line)) {
            const requestName = requestWReqPWoResP.exec(line)[1];
            const requestPayloadName = requestWReqPWoResP.exec(line)[2];
            const requestPayloadType = requestWReqPWoResP.exec(line)[3];
            requests.push({
                "name": requestName,
                "payload": {
                    "type": requestPayloadType,
                    "name": requestPayloadName
                }
            });
        }
        // Handles statement declaring a request with a single request payload
        // and a response payload
        // Sample statement :
        //  request getTemperatureFor(location: String) : Integer
        // Will produce
        // {
        //   "name": "getTemperatureFor",
        //   "payload": {
        //     "type": "String",
        //     "name": "location"
        //   },
        //   "respPayloadType": "Integer"
        // }
        //
        else if (requestWReqPWResP.test(line)) {
            const requestName = requestWReqPWResP.exec(line)[1];
            const requestPayloadName = requestWReqPWResP.exec(line)[2];
            const requestPayloadType = requestWReqPWResP.exec(line)[3];
            let responsePayloadType = requestWReqPWResP.exec(line)[4];

            requests.push({
                "name": requestName,
                "payload": {
                    "type": requestPayloadType,
                    "name": requestPayloadName
                },
                "respPayloadType": responsePayloadType
            });
        }
        // Handles statement declaring a request with no request payload and a
        // response payload
        // Sample statement :
        //  request getCurrentTemperature() : Integer
        // Will produce
        // {
        //   "name": "getCurrentTemperature",
        //   "respPayloadType": "Integer"
        // }
        else if (requestWoReqPWResP.test(line)) {
            const requestName = requestWoReqPWResP.exec(line)[1];
            let responsePayloadType = requestWoReqPWResP.exec(line)[2];

            requests.push({
                "name": requestName,
                "respPayloadType": responsePayloadType
            });
        } else {
            throw new Error(`unknown syntax '${line}' at line ${lineNo} in ${fileName}`);
        }
    }

    return view;
}
