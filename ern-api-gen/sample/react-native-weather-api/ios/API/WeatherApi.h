#import <Foundation/Foundation.h>

@interface WeatherApi : NSObject

- (void) handleRefreshWeatherRequest: (void (^_Nonnull)(id _Null_unspecified sender)) requestHandler;
- (void) handleRefreshWeatherForRequest: (void (^_Nonnull)(id _Null_unspecified sender)) requestHandler;
- (void) handleGetTemperatureForRequest: (void (^_Nonnull)(id _Null_unspecified sender)) requestHandler;
- (void) handleGetCurrentTemperatureRequest: (void (^_Nonnull)(id _Null_unspecified sender)) requestHandler;
- (void) handleGetCurrentLocationsRequest: (void (^_Nonnull)(id _Null_unspecified sender)) requestHandler;
- (void) handleGetLocationRequest: (void (^_Nonnull)(id _Null_unspecified sender)) requestHandler;
- (void) handleSetLocationRequest: (void (^_Nonnull)(id _Null_unspecified sender)) requestHandler;

@end
