/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/* globals Headers, Request, Response */

'use strict';

const whatwg = require('whatwg-fetch');

if (whatwg && whatwg.fetch) {
  module.exports = whatwg;
} else {
  module.exports = {fetch, Headers, Request, Response};
}
