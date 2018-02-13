/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "YGNode.h"
#include <iostream>

void* YGNode::getContext() const {
  return context_;
}

YGPrintFunc YGNode::getPrintFunc() const {
  return print_;
}

bool YGNode::getHasNewLayout() const {
  return hasNewLayout_;
}

YGNodeType YGNode::getNodeType() const {
  return nodeType_;
}

YGMeasureFunc YGNode::getMeasure() const {
  return measure_;
}

YGBaselineFunc YGNode::getBaseline() const {
  return baseline_;
}

YGStyle& YGNode::getStyle() {
  return style_;
}

YGLayout& YGNode::getLayout() {
  return layout_;
}

uint32_t YGNode::getLineIndex() const {
  return lineIndex_;
}

YGNodeRef YGNode::getParent() const {
  return parent_;
}

YGVector YGNode::getChildren() const {
  return children_;
}

YGNodeRef YGNode::getChild(uint32_t index) const {
  return children_.at(index);
}

YGNodeRef YGNode::getNextChild() const {
  return nextChild_;
}

YGConfigRef YGNode::getConfig() const {
  return config_;
}

bool YGNode::isDirty() const {
  return isDirty_;
}

YGValue YGNode::getResolvedDimension(int index) {
  return resolvedDimensions_[index];
}

std::array<YGValue, 2> YGNode::getResolvedDimensions() const {
  return resolvedDimensions_;
}
// Setters

void YGNode::setContext(void* context) {
  context_ = context;
}

void YGNode::setPrintFunc(YGPrintFunc printFunc) {
  print_ = printFunc;
}

void YGNode::setHasNewLayout(bool hasNewLayout) {
  hasNewLayout_ = hasNewLayout;
}

void YGNode::setNodeType(YGNodeType nodeType) {
  nodeType_ = nodeType;
}

void YGNode::setStyleFlexDirection(YGFlexDirection direction) {
  style_.flexDirection = direction;
}

void YGNode::setStyleAlignContent(YGAlign alignContent) {
  style_.alignContent = alignContent;
}

void YGNode::setMeasureFunc(YGMeasureFunc measureFunc) {
  if (measureFunc == nullptr) {
    measure_ = nullptr;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    nodeType_ = YGNodeTypeDefault;
  } else {
    YGAssertWithNode(
        this,
        children_.size() == 0,
        "Cannot set measure function: Nodes with measure functions cannot have children.");
    measure_ = measureFunc;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(YGNodeTypeText);
  }

  measure_ = measureFunc;
}

void YGNode::setBaseLineFunc(YGBaselineFunc baseLineFunc) {
  baseline_ = baseLineFunc;
}

void YGNode::setStyle(YGStyle style) {
  style_ = style;
}

void YGNode::setLayout(YGLayout layout) {
  layout_ = layout;
}

void YGNode::setLineIndex(uint32_t lineIndex) {
  lineIndex_ = lineIndex;
}

void YGNode::setParent(YGNodeRef parent) {
  parent_ = parent;
}

void YGNode::setChildren(YGVector children) {
  children_ = children;
}

void YGNode::setNextChild(YGNodeRef nextChild) {
  nextChild_ = nextChild;
}

void YGNode::replaceChild(YGNodeRef child, uint32_t index) {
  children_[index] = child;
}

void YGNode::replaceChild(YGNodeRef oldChild, YGNodeRef newChild) {
  std::replace(children_.begin(), children_.end(), oldChild, newChild);
}

void YGNode::insertChild(YGNodeRef child, uint32_t index) {
  children_.insert(children_.begin() + index, child);
}

void YGNode::setConfig(YGConfigRef config) {
  config_ = config;
}

void YGNode::setDirty(bool isDirty) {
  isDirty_ = isDirty;
}

bool YGNode::removeChild(YGNodeRef child) {
  std::vector<YGNodeRef>::iterator p =
      std::find(children_.begin(), children_.end(), child);
  if (p != children_.end()) {
    children_.erase(p);
    return true;
  }
  return false;
}

void YGNode::removeChild(uint32_t index) {
  children_.erase(children_.begin() + index);
}

void YGNode::setLayoutDirection(YGDirection direction) {
  layout_.direction = direction;
}

void YGNode::setLayoutMargin(float margin, int index) {
  layout_.margin[index] = margin;
}

void YGNode::setLayoutBorder(float border, int index) {
  layout_.border[index] = border;
}

void YGNode::setLayoutPadding(float padding, int index) {
  layout_.padding[index] = padding;
}

void YGNode::setLayoutLastParentDirection(YGDirection direction) {
  layout_.lastParentDirection = direction;
}

void YGNode::setLayoutComputedFlexBasis(float computedFlexBasis) {
  layout_.computedFlexBasis = computedFlexBasis;
}

void YGNode::setLayoutPosition(float position, int index) {
  layout_.position[index] = position;
}

void YGNode::setLayoutComputedFlexBasisGeneration(
    uint32_t computedFlexBasisGeneration) {
  layout_.computedFlexBasisGeneration = computedFlexBasisGeneration;
}

void YGNode::setLayoutMeasuredDimension(float measuredDimension, int index) {
  layout_.measuredDimensions[index] = measuredDimension;
}

void YGNode::setLayoutHadOverflow(bool hadOverflow) {
  layout_.hadOverflow = hadOverflow;
}

void YGNode::setLayoutDimension(float dimension, int index) {
  layout_.dimensions[index] = dimension;
}

YGNode::YGNode()
    : context_(nullptr),
      print_(nullptr),
      hasNewLayout_(true),
      nodeType_(YGNodeTypeDefault),
      measure_(nullptr),
      baseline_(nullptr),
      style_(gYGNodeStyleDefaults),
      layout_(gYGNodeLayoutDefaults),
      lineIndex_(0),
      parent_(nullptr),
      children_(YGVector()),
      nextChild_(nullptr),
      config_(nullptr),
      isDirty_(false),
      resolvedDimensions_({{YGValueUndefined, YGValueUndefined}}) {}

YGNode::YGNode(const YGNode& node)
    : context_(node.context_),
      print_(node.print_),
      hasNewLayout_(node.hasNewLayout_),
      nodeType_(node.nodeType_),
      measure_(node.measure_),
      baseline_(node.baseline_),
      style_(node.style_),
      layout_(node.layout_),
      lineIndex_(node.lineIndex_),
      parent_(node.parent_),
      children_(node.children_),
      nextChild_(node.nextChild_),
      config_(node.config_),
      isDirty_(node.isDirty_),
      resolvedDimensions_(node.resolvedDimensions_) {}

YGNode::YGNode(const YGConfigRef newConfig) : YGNode() {
  config_ = newConfig;
}

YGNode::YGNode(
    void* context,
    YGPrintFunc print,
    bool hasNewLayout,
    YGNodeType nodeType,
    YGMeasureFunc measure,
    YGBaselineFunc baseline,
    YGStyle style,
    YGLayout layout,
    uint32_t lineIndex,
    YGNodeRef parent,
    YGVector children,
    YGNodeRef nextChild,
    YGConfigRef config,
    bool isDirty,
    std::array<YGValue, 2> resolvedDimensions)
    : context_(context),
      print_(print),
      hasNewLayout_(hasNewLayout),
      nodeType_(nodeType),
      measure_(measure),
      baseline_(baseline),
      style_(style),
      layout_(layout),
      lineIndex_(lineIndex),
      parent_(parent),
      children_(children),
      nextChild_(nextChild),
      config_(config),
      isDirty_(isDirty),
      resolvedDimensions_(resolvedDimensions) {}

YGNode& YGNode::operator=(const YGNode& node) {
  if (&node == this) {
    return *this;
  }

  for (auto child : children_) {
    delete child;
  }

  context_ = node.getContext();
  print_ = node.getPrintFunc();
  hasNewLayout_ = node.getHasNewLayout();
  nodeType_ = node.getNodeType();
  measure_ = node.getMeasure();
  baseline_ = node.getBaseline();
  style_ = node.style_;
  layout_ = node.layout_;
  lineIndex_ = node.getLineIndex();
  parent_ = node.getParent();
  children_ = node.getChildren();
  nextChild_ = node.getNextChild();
  config_ = node.getConfig();
  isDirty_ = node.isDirty();
  resolvedDimensions_ = node.getResolvedDimensions();

  return *this;
}

YGValue YGNode::marginLeadingValue(const YGFlexDirection axis) const {
  if (YGFlexDirectionIsRow(axis) &&
      style_.margin[YGEdgeStart].unit != YGUnitUndefined) {
    return style_.margin[YGEdgeStart];
  } else {
    return style_.margin[leading[axis]];
  }
}

YGValue YGNode::marginTrailingValue(const YGFlexDirection axis) const {
  if (YGFlexDirectionIsRow(axis) &&
      style_.margin[YGEdgeEnd].unit != YGUnitUndefined) {
    return style_.margin[YGEdgeEnd];
  } else {
    return style_.margin[trailing[axis]];
  }
}

YGValue YGNode::resolveFlexBasisPtr() const {
  YGValue flexBasis = style_.flexBasis;
  if (flexBasis.unit != YGUnitAuto && flexBasis.unit != YGUnitUndefined) {
    return flexBasis;
  }
  if (!YGFloatIsUndefined(style_.flex) && style_.flex > 0.0f) {
    return config_->useWebDefaults ? YGValueAuto : YGValueZero;
  }
  return YGValueAuto;
}

void YGNode::resolveDimension() {
  for (uint32_t dim = YGDimensionWidth; dim < YGDimensionCount; dim++) {
    if (getStyle().maxDimensions[dim].unit != YGUnitUndefined &&
        YGValueEqual(
            getStyle().maxDimensions[dim], style_.minDimensions[dim])) {
      resolvedDimensions_[dim] = style_.maxDimensions[dim];
    } else {
      resolvedDimensions_[dim] = style_.dimensions[dim];
    }
  }
}

void YGNode::clearChildren() {
  children_.clear();
  children_.shrink_to_fit();
}

YGNode::~YGNode() {
  // All the member variables are deallocated externally, so no need to
  // deallocate here
}

// Other Methods

void YGNode::cloneChildrenIfNeeded() {
  // YGNodeRemoveChild in yoga.cpp has a forked variant of this algorithm
  // optimized for deletions.

  const uint32_t childCount = static_cast<uint32_t>(children_.size());
  if (childCount == 0) {
    // This is an empty set. Nothing to clone.
    return;
  }

  const YGNodeRef firstChild = children_.front();
  if (firstChild->getParent() == this) {
    // If the first child has this node as its parent, we assume that it is
    // already unique. We can do this because if we have it has a child, that
    // means that its parent was at some point cloned which made that subtree
    // immutable. We also assume that all its sibling are cloned as well.
    return;
  }

  const YGNodeClonedFunc cloneNodeCallback = config_->cloneNodeCallback;
  for (uint32_t i = 0; i < childCount; ++i) {
    const YGNodeRef oldChild = children_[i];
    const YGNodeRef newChild = YGNodeClone(oldChild);
    replaceChild(newChild, i);
    newChild->setParent(this);
    if (cloneNodeCallback) {
      cloneNodeCallback(oldChild, newChild, this, i);
    }
  }
}

void YGNode::markDirtyAndPropogate() {
  if (!isDirty_) {
    isDirty_ = true;
    setLayoutComputedFlexBasis(YGUndefined);
    if (parent_) {
      parent_->markDirtyAndPropogate();
    }
  }
}

float YGNode::resolveFlexGrow() {
  // Root nodes flexGrow should always be 0
  if (parent_ == nullptr) {
    return 0.0;
  }
  if (!YGFloatIsUndefined(style_.flexGrow)) {
    return style_.flexGrow;
  }
  if (!YGFloatIsUndefined(style_.flex) && style_.flex > 0.0f) {
    return style_.flex;
  }
  return kDefaultFlexGrow;
}

float YGNode::resolveFlexShrink() {
  if (parent_ == nullptr) {
    return 0.0;
  }
  if (!YGFloatIsUndefined(style_.flexShrink)) {
    return style_.flexShrink;
  }
  if (!config_->useWebDefaults && !YGFloatIsUndefined(style_.flex) &&
      style_.flex < 0.0f) {
    return -style_.flex;
  }
  return config_->useWebDefaults ? kWebDefaultFlexShrink : kDefaultFlexShrink;
}
