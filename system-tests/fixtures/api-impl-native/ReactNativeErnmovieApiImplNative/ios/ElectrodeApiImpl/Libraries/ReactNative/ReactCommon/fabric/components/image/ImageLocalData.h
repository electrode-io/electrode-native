/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/core/LocalData.h>
#include <fabric/imagemanager/primitives.h>
#include <fabric/imagemanager/ImageRequest.h>

namespace facebook {
namespace react {

class ImageLocalData;

using SharedImageLocalData = std::shared_ptr<const ImageLocalData>;

/*
 * LocalData for <Image> component.
 * Represents the image request state and (possible) retrieved image bitmap.
 */
class ImageLocalData:
  public LocalData {

public:

  ImageLocalData(const ImageSource &imageSource, ImageRequest imageRequest):
    imageSource_(imageSource),
    imageRequest_(std::move(imageRequest)) {};

  /*
   * Returns stored ImageSource object.
   */
  ImageSource getImageSource() const;

  /*
   * Exposes for reading stored `ImageRequest` object.
   * `ImageRequest` object cannot be copied or moved from `ImageLocalData`.
   */
  const ImageRequest &getImageRequest() const;

#pragma mark - DebugStringConvertible

  std::string getDebugName() const override;
  SharedDebugStringConvertibleList getDebugProps() const override;

private:

  ImageSource imageSource_;
  ImageRequest imageRequest_;
};

} // namespace react
} // namespace facebook
