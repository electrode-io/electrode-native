/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/components/scrollview/ScrollViewEventEmitter.h>
#include <fabric/components/scrollview/ScrollViewProps.h>
#include <fabric/components/view/ConcreteViewShadowNode.h>
#include <fabric/core/LayoutContext.h>

namespace facebook {
namespace react {

extern const char ScrollViewComponentName[];

/*
 * `ShadowNode` for <ScrollView> component.
 */
class ScrollViewShadowNode final:
  public ConcreteViewShadowNode<
    ScrollViewComponentName,
    ScrollViewProps,
    ScrollViewEventEmitter
  > {

public:

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

private:

  void updateLocalData();
};

} // namespace react
} // namespace facebook
