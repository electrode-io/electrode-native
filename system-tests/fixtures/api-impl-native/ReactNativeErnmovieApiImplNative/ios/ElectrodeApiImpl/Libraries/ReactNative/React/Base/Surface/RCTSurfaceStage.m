/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfaceStage.h"

BOOL RCTSurfaceStageIsRunning(RCTSurfaceStage stage) {
  return
    (stage & RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & RCTSurfaceStageSurfaceDidStop);
}

BOOL RCTSurfaceStageIsPreparing(RCTSurfaceStage stage) {
  return
    !(stage & RCTSurfaceStageSurfaceDidInitialLayout) &&
    !(stage & RCTSurfaceStageSurfaceDidStop);
}
