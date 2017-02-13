#import "LatLng.h"

@implementation LatLng

+ (instancetype _Nullable) modelFromDictionary: (NSDictionary<NSString *, id> *_Nonnull) dictionary {
  LatLng *latLng = [[LatLng alloc] init];
  
  NSNumber * lat = dictionary[@"lat"];
  latLng.lat = lat;

  NSNumber * lng = dictionary[@"lng"];
  latLng.lng = lng;

  NSString * name = dictionary[@"name"];
  latLng.name = name;

  
  return latLng;
}

- (NSDictionary<NSString *, id>  *_Nonnull) toDictionary {
  return @{
    @"lat" : [self lat],
    @"lng" : [self lng],
    @"name" : [self name]
  };
}

@end
