#import <Foundation/Foundation.h>


@interface LatLng : NSObject

@property (nonatomic, nonnull, strong) NSNumber * lat;
@property (nonatomic, nonnull, strong) NSNumber * lng;
@property (nonatomic, nonnull, strong) NSString * name;

+ (instancetype _Nullable) modelFromDictionary: (NSDictionary<NSString *, id> *_Nonnull) dictionary;

- (NSDictionary<NSString *, id>  *_Nonnull) toDictionary;

@end
