/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <fabric/uimanager/TreeMutationInstruction.h>
#import <React/RCTPrimitives.h>
#import <React/RCTMountingManagerDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTComponentViewRegistry;

/**
 * Manages mounting process.
 */
@interface RCTMountingManager : NSObject

@property (nonatomic, weak) id <RCTMountingManagerDelegate> delegate;
@property (nonatomic, strong) RCTComponentViewRegistry *componentViewRegistry;

/**
 * Transfroms mutation insturctions to mount items and execute them.
 * The order of mutation tnstructions matters.
 * Can be called from any thread.
 */
- (void)mutateComponentViewTreeWithMutationInstructions:(facebook::react::TreeMutationInstructionList)instructions
                                                rootTag:(ReactTag)rootTag;

/**
 * Suggests preliminary creation of a component view of given type.
 * The receiver is free to ignore the request.
 * Can be called from any thread.
 */
- (void)preliminaryCreateComponentViewWithName:(NSString *)componentName;

@end

NS_ASSUME_NONNULL_END
