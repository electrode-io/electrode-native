#import "LatLong.h"

@implementation LatLong

+ (instancetype _Nullable) modelFromDictionary: (NSDictionary<NSString *, id> *_Nonnull) dictionary {
  LatLong *latLong = [[LatLong alloc] init];
  
  NSNumber * lat = dictionary[@"lat"];
  latLong.lat = lat;

  NSNumber * long = dictionary[@"long"];
  latLong.long = long;

  
  return latLong;
}

- (NSDictionary<NSString *, id>  *_Nonnull) toDictionary {
  return @{
    @"lat" : [self lat],
    @"long" : [self long]
  };
}

@end
