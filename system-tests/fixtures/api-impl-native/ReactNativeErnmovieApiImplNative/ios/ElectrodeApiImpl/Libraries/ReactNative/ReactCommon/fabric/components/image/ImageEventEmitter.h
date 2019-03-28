/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <fabric/components/view/ViewEventEmitter.h>

namespace facebook {
namespace react {

class ImageEventEmitter:
  public ViewEventEmitter {

public:
  using ViewEventEmitter::ViewEventEmitter;

  void onLoadStart() const;
  void onLoad() const;
  void onLoadEnd() const;
  void onProgress() const;
  void onError() const;
  void onPartialLoad() const;
};

} // namespace react
} // namespace facebook
