/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CameraRoll
 * @flow
 * @format
 */
'use strict';

const PropTypes = require('prop-types');
const {checkPropTypes} = PropTypes;
const RCTCameraRollManager = require('NativeModules').CameraRollManager;

const createStrictShapeTypeChecker = require('createStrictShapeTypeChecker');
const invariant = require('fbjs/lib/invariant');

const GROUP_TYPES_OPTIONS = {
  Album: 'Album',
  All: 'All',
  Event: 'Event',
  Faces: 'Faces',
  Library: 'Library',
  PhotoStream: 'PhotoStream',
  SavedPhotos: 'SavedPhotos', // default
};

const ASSET_TYPE_OPTIONS = {
  All: 'All',
  Videos: 'Videos',
  Photos: 'Photos',
};

type GetPhotosParams = {
  first: number,
  after?: string,
  groupTypes?: $Keys<typeof GROUP_TYPES_OPTIONS>,
  groupName?: string,
  assetType?: $Keys<typeof ASSET_TYPE_OPTIONS>,
  mimeTypes?: Array<string>,
};

/**
 * Shape of the param arg for the `getPhotos` function.
 */
const getPhotosParamChecker = createStrictShapeTypeChecker({
  /**
   * The number of photos wanted in reverse order of the photo application
   * (i.e. most recent first for SavedPhotos).
   */
  first: PropTypes.number.isRequired,

  /**
   * A cursor that matches `page_info { end_cursor }` returned from a previous
   * call to `getPhotos`
   */
  after: PropTypes.string,

  /**
   * Specifies which group types to filter the results to.
   */
  groupTypes: PropTypes.oneOf(Object.keys(GROUP_TYPES_OPTIONS)),

  /**
   * Specifies filter on group names, like 'Recent Photos' or custom album
   * titles.
   */
  groupName: PropTypes.string,

  /**
   * Specifies filter on asset type
   */
  assetType: PropTypes.oneOf(Object.keys(ASSET_TYPE_OPTIONS)),

  /**
   * Filter by mimetype (e.g. image/jpeg).
   */
  mimeTypes: PropTypes.arrayOf(PropTypes.string),
});

type GetPhotosReturn = Promise<{
  edges: Array<{
    node: {
      type: string,
      group_name: string,
      image: {
        uri: string,
        height: number,
        width: number,
        isStored?: boolean,
        playableDuration: number,
      },
      timestamp: number,
      location?: {
        latitude?: number,
        longitude?: number,
        altitude?: number,
        heading?: number,
        speed?: number,
      },
    },
  }>,
  page_info: {
    has_next_page: boolean,
    start_cursor?: string,
    end_cursor?: string,
  },
}>;

/**
 * Shape of the return value of the `getPhotos` function.
 */
const getPhotosReturnChecker = createStrictShapeTypeChecker({
  // $FlowFixMe(>=0.41.0)
  edges: PropTypes.arrayOf(
    createStrictShapeTypeChecker({
      node: createStrictShapeTypeChecker({
        type: PropTypes.string.isRequired,
        group_name: PropTypes.string.isRequired,
        image: createStrictShapeTypeChecker({
          uri: PropTypes.string.isRequired,
          height: PropTypes.number.isRequired,
          width: PropTypes.number.isRequired,
          isStored: PropTypes.bool,
          playableDuration: PropTypes.number.isRequired,
        }).isRequired,
        timestamp: PropTypes.number.isRequired,
        location: createStrictShapeTypeChecker({
          latitude: PropTypes.number,
          longitude: PropTypes.number,
          altitude: PropTypes.number,
          heading: PropTypes.number,
          speed: PropTypes.number,
        }),
      }).isRequired,
    }),
  ).isRequired,
  page_info: createStrictShapeTypeChecker({
    has_next_page: PropTypes.bool.isRequired,
    start_cursor: PropTypes.string,
    end_cursor: PropTypes.string,
  }).isRequired,
});

/**
 * `CameraRoll` provides access to the local camera roll or photo library.
 *
 * See https://facebook.github.io/react-native/docs/cameraroll.html
 */
class CameraRoll {
  static GroupTypesOptions: Object = GROUP_TYPES_OPTIONS;
  static AssetTypeOptions: Object = ASSET_TYPE_OPTIONS;

  /**
   * `CameraRoll.saveImageWithTag()` is deprecated. Use `CameraRoll.saveToCameraRoll()` instead.
   */
  static saveImageWithTag(tag: string): Promise<string> {
    console.warn(
      '`CameraRoll.saveImageWithTag()` is deprecated. Use `CameraRoll.saveToCameraRoll()` instead.',
    );
    return this.saveToCameraRoll(tag, 'photo');
  }

  static deletePhotos(photos: Array<string>) {
    return RCTCameraRollManager.deletePhotos(photos);
  }

  /**
   * Saves the photo or video to the camera roll or photo library.
   *
   * See https://facebook.github.io/react-native/docs/cameraroll.html#savetocameraroll
   */
  static saveToCameraRoll(
    tag: string,
    type?: 'photo' | 'video',
  ): Promise<string> {
    invariant(
      typeof tag === 'string',
      'CameraRoll.saveToCameraRoll must be a valid string.',
    );

    invariant(
      type === 'photo' || type === 'video' || type === undefined,
      `The second argument to saveToCameraRoll must be 'photo' or 'video'. You passed ${type ||
        'unknown'}`,
    );

    let mediaType = 'photo';
    if (type) {
      mediaType = type;
    } else if (['mov', 'mp4'].indexOf(tag.split('.').slice(-1)[0]) >= 0) {
      mediaType = 'video';
    }

    return RCTCameraRollManager.saveToCameraRoll(tag, mediaType);
  }

  /**
   * Returns a Promise with photo identifier objects from the local camera
   * roll of the device matching shape defined by `getPhotosReturnChecker`.
   *
   * See https://facebook.github.io/react-native/docs/cameraroll.html#getphotos
   */
  static getPhotos(params: GetPhotosParams): GetPhotosReturn {
    if (__DEV__) {
      checkPropTypes(
        {params: getPhotosParamChecker},
        {params},
        'params',
        'CameraRoll.getPhotos',
      );
    }
    if (arguments.length > 1) {
      console.warn(
        'CameraRoll.getPhotos(tag, success, error) is deprecated.  Use the returned Promise instead',
      );
      let successCallback = arguments[1];
      if (__DEV__) {
        const callback = arguments[1];
        successCallback = response => {
          checkPropTypes(
            {response: getPhotosReturnChecker},
            {response},
            'response',
            'CameraRoll.getPhotos callback',
          );
          callback(response);
        };
      }
      const errorCallback = arguments[2] || (() => {});
      RCTCameraRollManager.getPhotos(params).then(
        successCallback,
        errorCallback,
      );
    }
    // TODO: Add the __DEV__ check back in to verify the Promise result
    return RCTCameraRollManager.getPhotos(params);
  }
}

module.exports = CameraRoll;
