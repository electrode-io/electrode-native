/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Geolocation
 * @flow
 */
'use strict';

const NativeEventEmitter = require('NativeEventEmitter');
const RCTLocationObserver = require('NativeModules').LocationObserver;

const invariant = require('fbjs/lib/invariant');
const logError = require('logError');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const warning = require('fbjs/lib/warning');

const LocationEventEmitter = new NativeEventEmitter(RCTLocationObserver);

const Platform = require('Platform');
const PermissionsAndroid = require('PermissionsAndroid');

var subscriptions = [];
var updatesEnabled = false;

type GeoConfiguration = {
  skipPermissionRequests: bool;
}

type GeoOptions = {
  timeout?: number,
  maximumAge?: number,
  enableHighAccuracy?: bool,
  distanceFilter: number,
  useSignificantChanges?: bool,
}

/**
 * The Geolocation API extends the web spec:
 * https://developer.mozilla.org/en-US/docs/Web/API/Geolocation
 *
 * See https://facebook.github.io/react-native/docs/geolocation.html
 */
var Geolocation = {

  /*
    * Sets configuration options that will be used in all location requests.
    *
    * See https://facebook.github.io/react-native/docs/geolocation.html#setrnconfiguration
    *
    */
  setRNConfiguration: function(
    config: GeoConfiguration
  ) {
    if (RCTLocationObserver.setConfiguration) {
      RCTLocationObserver.setConfiguration(config);
    }
  },

  /*
   * Request suitable Location permission based on the key configured on pList.
   * 
   * See https://facebook.github.io/react-native/docs/geolocation.html#requestauthorization
   */
  requestAuthorization: function() {
    RCTLocationObserver.requestAuthorization();
  },

  /*
   * Invokes the success callback once with the latest location info. 
   * 
   * See https://facebook.github.io/react-native/docs/geolocation.html#getcurrentposition
   */
  getCurrentPosition: async function(
    geo_success: Function,
    geo_error?: Function,
    geo_options?: GeoOptions
  ) {
    invariant(
      typeof geo_success === 'function',
      'Must provide a valid geo_success callback.'
    );
    let hasPermission = true;
    // Supports Android's new permission model. For Android older devices,
    // it's always on.
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (!hasPermission) {
        const status = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        hasPermission = status === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    if (hasPermission) {
      RCTLocationObserver.getCurrentPosition(
        geo_options || {},
        geo_success,
        geo_error || logError,
      );
    }
  },

  /*
   * Invokes the success callback whenever the location changes.
   * 
   * See https://facebook.github.io/react-native/docs/geolocation.html#watchposition
   */
  watchPosition: function(success: Function, error?: Function, options?: GeoOptions): number {
    if (!updatesEnabled) {
      RCTLocationObserver.startObserving(options || {});
      updatesEnabled = true;
    }
    var watchID = subscriptions.length;
    subscriptions.push([
      LocationEventEmitter.addListener(
        'geolocationDidChange',
        success
      ),
      error ? LocationEventEmitter.addListener(
        'geolocationError',
        error
      ) : null,
    ]);
    return watchID;
  },

  clearWatch: function(watchID: number) {
    var sub = subscriptions[watchID];
    if (!sub) {
      // Silently exit when the watchID is invalid or already cleared
      // This is consistent with timers
      return;
    }

    sub[0].remove();
    // array element refinements not yet enabled in Flow
    var sub1 = sub[1]; sub1 && sub1.remove();
    subscriptions[watchID] = undefined;
    var noWatchers = true;
    for (var ii = 0; ii < subscriptions.length; ii++) {
      if (subscriptions[ii]) {
        noWatchers = false; // still valid subscriptions
      }
    }
    if (noWatchers) {
      Geolocation.stopObserving();
    }
  },

  stopObserving: function() {
    if (updatesEnabled) {
      RCTLocationObserver.stopObserving();
      updatesEnabled = false;
      for (var ii = 0; ii < subscriptions.length; ii++) {
        var sub = subscriptions[ii];
        if (sub) {
          warning(false, 'Called stopObserving with existing subscriptions.');
          sub[0].remove();
          // array element refinements not yet enabled in Flow
          var sub1 = sub[1]; sub1 && sub1.remove();
        }
      }
      subscriptions = [];
    }
  }
};

module.exports = Geolocation;
