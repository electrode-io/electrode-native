//
//  NSBundle+frameworkBundle.m
//  ElectrodeContainer
//
//  Created by Claire Weijie Li on 8/4/17.
//  Copyright © 2017 Walmart. All rights reserved.
//

#import "NSBundle+frameworkBundle.h"

@implementation NSBundle (frameworkBundle)
+ (NSBundle *)frameworkBundle {
    static NSBundle* frameworkBundle = nil;
    static dispatch_once_t predicate;
    dispatch_once(&predicate, ^{
        NSString* mainBundlePath = [[NSBundle mainBundle] resourcePath];
        NSString* frameworkBundlePath = [mainBundlePath stringByAppendingPathComponent:@"Frameworks/ElectrodeContainer.framework"];
        frameworkBundle = [NSBundle bundleWithPath:frameworkBundlePath];
    });
    return frameworkBundle;
}
@end
