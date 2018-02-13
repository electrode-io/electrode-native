/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponent.h>
#import <React/RCTRootView.h>
#import <yoga/Yoga.h>

@class RCTRootShadowView;
@class RCTSparseArray;

typedef NS_ENUM(NSUInteger, RCTUpdateLifecycle) {
  RCTUpdateLifecycleUninitialized = 0,
  RCTUpdateLifecycleComputed,
  RCTUpdateLifecycleDirtied,
};

typedef void (^RCTApplierBlock)(NSDictionary<NSNumber *, UIView *> *viewRegistry);

/**
 * ShadowView tree mirrors RCT view tree. Every node is highly stateful.
 * 1. A node is in one of three lifecycles: uninitialized, computed, dirtied.
 * 1. RCTBridge may call any of the padding/margin/width/height/top/left setters. A setter would dirty
 *    the node and all of its ancestors.
 * 2. At the end of each Bridge transaction, we call collectUpdatedFrames:widthConstraint:heightConstraint
 *    at the root node to recursively lay out the entire hierarchy.
 * 3. If a node is "computed" and the constraint passed from above is identical to the constraint used to
 *    perform the last computation, we skip laying out the subtree entirely.
 */
@interface RCTShadowView : NSObject <RCTComponent>

/**
 * Yoga Config which will be used to create `yogaNode` property.
 * Override in subclass to enable special Yoga features.
 * Defaults to suitable to current device configuration.
 */
+ (YGConfigRef)yogaConfig;

/**
 * RCTComponent interface.
 */
- (NSArray<RCTShadowView *> *)reactSubviews NS_REQUIRES_SUPER;
- (RCTShadowView *)reactSuperview NS_REQUIRES_SUPER;
- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex NS_REQUIRES_SUPER;
- (void)removeReactSubview:(RCTShadowView *)subview NS_REQUIRES_SUPER;

@property (nonatomic, weak, readonly) RCTRootShadowView *rootView;
@property (nonatomic, weak, readonly) RCTShadowView *superview;
@property (nonatomic, assign, readonly) YGNodeRef yogaNode;
@property (nonatomic, copy) NSString *viewName;
@property (nonatomic, copy) RCTDirectEventBlock onLayout;

/**
 * In some cases we need a way to specify some environmental data to shadow view
 * to improve layout (or do something similar), so `localData` serves these needs.
 * For example, any stateful embedded native views may benefit from this.
 * Have in mind that this data is not supposed to interfere with the state of
 * the shadow view.
 * Please respect one-directional data flow of React.
 * Use `-[RCTUIManager setLocalData:forView:]` to set this property
 * (to provide local/environmental data for a shadow view) from the main thread.
 */
- (void)setLocalData:(NSObject *)localData;

/**
 * isNewView - Used to track the first time the view is introduced into the hierarchy.  It is initialized YES, then is
 * set to NO in RCTUIManager after the layout pass is done and all frames have been extracted to be applied to the
 * corresponding UIViews.
 */
@property (nonatomic, assign, getter=isNewView) BOOL newView;

/**
 * isHidden - RCTUIManager uses this to determine whether or not the UIView should be hidden. Useful if the
 * ShadowView determines that its UIView will be clipped and wants to hide it.
 */
@property (nonatomic, assign, getter=isHidden) BOOL hidden;

/**
 * Computed layout direction of the view.
 */

@property (nonatomic, assign, readonly) UIUserInterfaceLayoutDirection layoutDirection;

/**
 * Position and dimensions.
 * Defaults to { 0, 0, NAN, NAN }.
 */
@property (nonatomic, assign) YGValue top;
@property (nonatomic, assign) YGValue left;
@property (nonatomic, assign) YGValue bottom;
@property (nonatomic, assign) YGValue right;
@property (nonatomic, assign) YGValue start;
@property (nonatomic, assign) YGValue end;

@property (nonatomic, assign) YGValue width;
@property (nonatomic, assign) YGValue height;

@property (nonatomic, assign) YGValue minWidth;
@property (nonatomic, assign) YGValue maxWidth;
@property (nonatomic, assign) YGValue minHeight;
@property (nonatomic, assign) YGValue maxHeight;

/**
 * Convenient alias to `width` and `height` in pixels.
 * Defaults to NAN in case of non-pixel dimention.
 */
@property (nonatomic, assign) CGSize size;

/**
 * Border. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) float borderWidth;
@property (nonatomic, assign) float borderTopWidth;
@property (nonatomic, assign) float borderLeftWidth;
@property (nonatomic, assign) float borderBottomWidth;
@property (nonatomic, assign) float borderRightWidth;
@property (nonatomic, assign) float borderStartWidth;
@property (nonatomic, assign) float borderEndWidth;

/**
 * Margin. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) YGValue margin;
@property (nonatomic, assign) YGValue marginVertical;
@property (nonatomic, assign) YGValue marginHorizontal;
@property (nonatomic, assign) YGValue marginTop;
@property (nonatomic, assign) YGValue marginLeft;
@property (nonatomic, assign) YGValue marginBottom;
@property (nonatomic, assign) YGValue marginRight;
@property (nonatomic, assign) YGValue marginStart;
@property (nonatomic, assign) YGValue marginEnd;

/**
 * Padding. Defaults to { 0, 0, 0, 0 }.
 */
@property (nonatomic, assign) YGValue padding;
@property (nonatomic, assign) YGValue paddingVertical;
@property (nonatomic, assign) YGValue paddingHorizontal;
@property (nonatomic, assign) YGValue paddingTop;
@property (nonatomic, assign) YGValue paddingLeft;
@property (nonatomic, assign) YGValue paddingBottom;
@property (nonatomic, assign) YGValue paddingRight;
@property (nonatomic, assign) YGValue paddingStart;
@property (nonatomic, assign) YGValue paddingEnd;

/**
 * Flexbox properties. All zero/disabled by default
 */
@property (nonatomic, assign) YGFlexDirection flexDirection;
@property (nonatomic, assign) YGJustify justifyContent;
@property (nonatomic, assign) YGAlign alignSelf;
@property (nonatomic, assign) YGAlign alignItems;
@property (nonatomic, assign) YGAlign alignContent;
@property (nonatomic, assign) YGPositionType position;
@property (nonatomic, assign) YGWrap flexWrap;
@property (nonatomic, assign) YGDisplay display;

@property (nonatomic, assign) float flex;
@property (nonatomic, assign) float flexGrow;
@property (nonatomic, assign) float flexShrink;
@property (nonatomic, assign) YGValue flexBasis;

@property (nonatomic, assign) float aspectRatio;

/**
 * Interface direction (LTR or RTL)
 */
@property (nonatomic, assign) YGDirection direction;

/**
 * Clipping properties
 */
@property (nonatomic, assign) YGOverflow overflow;

/**
 * Computed position of the view.
 */
@property (nonatomic, assign, readonly) CGRect frame;

/**
 * Represents the natural size of the view, which is used when explicit size is not set or is ambiguous.
 * Defaults to `{UIViewNoIntrinsicMetric, UIViewNoIntrinsicMetric}`.
 */
@property (nonatomic, assign) CGSize intrinsicContentSize;

/**
 * Calculate property changes that need to be propagated to the view.
 * The applierBlocks set contains RCTApplierBlock functions that must be applied
 * on the main thread in order to update the view.
 */
- (void)collectUpdatedProperties:(NSMutableSet<RCTApplierBlock> *)applierBlocks
                parentProperties:(NSDictionary<NSString *, id> *)parentProperties;

/**
 * Process the updated properties and apply them to view. Shadow view classes
 * that add additional propagating properties should override this method.
 */
- (NSDictionary<NSString *, id> *)processUpdatedProperties:(NSMutableSet<RCTApplierBlock> *)applierBlocks
                                          parentProperties:(NSDictionary<NSString *, id> *)parentProperties NS_REQUIRES_SUPER;

/**
 * Can be called by a parent on a child in order to calculate all views whose frame needs
 * updating in that branch. Adds these frames to `viewsWithNewFrame`. Useful if layout
 * enters a view where flex doesn't apply (e.g. Text) and then you want to resume flex
 * layout on a subview.
 */
- (void)collectUpdatedFrames:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
                   withFrame:(CGRect)frame
                      hidden:(BOOL)hidden
            absolutePosition:(CGPoint)absolutePosition;

/**
 * Apply the CSS layout.
 * This method also calls `applyLayoutToChildren:` internally. The functionality
 * is split into two methods so subclasses can override `applyLayoutToChildren:`
 * while using default implementation of `applyLayoutNode:`.
 */
- (void)applyLayoutNode:(YGNodeRef)node
      viewsWithNewFrame:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition NS_REQUIRES_SUPER;

/**
 * Enumerate the child nodes and tell them to apply layout.
 */
- (void)applyLayoutToChildren:(YGNodeRef)node
            viewsWithNewFrame:(NSMutableSet<RCTShadowView *> *)viewsWithNewFrame
             absolutePosition:(CGPoint)absolutePosition;

/**
 * Returns whether or not this view can have any subviews.
 * Adding/inserting a child view to leaf view (`canHaveSubviews` equals `NO`)
 * will throw an error.
 * Return `NO` for components which must not have any descendants
 * (like <Image>, for example.)
 * Defaults to `YES`. Can be overridden in subclasses.
 * Don't confuse this with `isYogaLeafNode`.
 */
- (BOOL)canHaveSubviews;

/**
 * Returns whether or not this node acts as a leaf node in the eyes of Yoga.
 * For example `RCTTextShadowView` has children which it does not want Yoga
 * to lay out so in the eyes of Yoga it is a leaf node.
 * Defaults to `NO`. Can be overridden in subclasses.
 * Don't confuse this with `canHaveSubviews`.
 */
- (BOOL)isYogaLeafNode;

- (void)dirtyPropagation NS_REQUIRES_SUPER;
- (BOOL)isPropagationDirty;

- (void)dirtyText NS_REQUIRES_SUPER;
- (void)setTextComputed NS_REQUIRES_SUPER;
- (BOOL)isTextDirty;

/**
 * As described in RCTComponent protocol.
 */
- (void)didUpdateReactSubviews NS_REQUIRES_SUPER;
- (void)didSetProps:(NSArray<NSString *> *)changedProps NS_REQUIRES_SUPER;

/**
 * Computes the recursive offset, meaning the sum of all descendant offsets -
 * this is the sum of all positions inset from parents. This is not merely the
 * sum of `top`/`left`s, as this function uses the *actual* positions of
 * children, not the style specified positions - it computes this based on the
 * resulting layout. It does not yet compensate for native scroll view insets or
 * transforms or anchor points.
 */
- (CGRect)measureLayoutRelativeToAncestor:(RCTShadowView *)ancestor;

/**
 * Checks if the current shadow view is a descendant of the provided `ancestor`
 */
- (BOOL)viewIsDescendantOf:(RCTShadowView *)ancestor;

@end
