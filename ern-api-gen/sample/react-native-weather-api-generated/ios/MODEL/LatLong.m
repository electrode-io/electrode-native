#import "LatLong.h"

@implementation LatLong

+ (instancetype _Nullable) modelFromDictionary: (NSDictionary<NSString *, id> *_Nonnull) dictionary {
  LatLong *latLong = [[LatLong alloc] init];
  
  NSNumber * lat = dictionary[@"lat"];
  latLong.lat = lat;

  NSNumber * lon = dictionary[@"lon"];
  latLong.lon = lon;

  
  return latLong;
}

- (NSDictionary<NSString *, id>  *_Nonnull) toDictionary {
  return @{
    @"lat" : [self lat],
    @"lon" : [self lon]
  };
}

@end
