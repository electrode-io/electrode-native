#import <Foundation/Foundation.h>


@interface LatLong : NSObject

@property (nonatomic, nonnull, strong) NSNumber * lat;
@property (nonatomic, nonnull, strong) NSNumber * lon;

+ (instancetype _Nullable) modelFromDictionary: (NSDictionary<NSString *, id> *_Nonnull) dictionary;

- (NSDictionary<NSString *, id>  *_Nonnull) toDictionary;

@end
