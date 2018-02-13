
#import "RCTInspector.h"

#if RCT_DEV

#include <jschelpers/JavaScriptCore.h>
#include <jsinspector/InspectorInterfaces.h>

#import "RCTDefines.h"
#import "RCTInspectorPackagerConnection.h"
#import "RCTLog.h"
#import "RCTSRWebSocket.h"
#import "RCTUtils.h"

using namespace facebook::react;

// This is a port of the Android impl, at
// react-native-github/ReactAndroid/src/main/java/com/facebook/react/bridge/Inspector.java
// react-native-github/ReactAndroid/src/main/jni/react/jni/JInspector.cpp
// please keep consistent :)

class RemoteConnection : public IRemoteConnection {
public:
RemoteConnection(RCTInspectorRemoteConnection *connection) :
  _connection(connection) {}

  virtual void onMessage(std::string message) override {
    [_connection onMessage:@(message.c_str())];
  }

  virtual void onDisconnect() override {
    [_connection onDisconnect];
  }
private:
  const RCTInspectorRemoteConnection *_connection;
};

@interface RCTInspectorPage () {
  NSInteger _id;
  NSString *_title;
}
- (instancetype)initWithId:(NSInteger)id
                     title:(NSString *)title;
@end

@interface RCTInspectorLocalConnection () {
  std::unique_ptr<ILocalConnection> _connection;
}
- (instancetype)initWithConnection:(std::unique_ptr<ILocalConnection>)connection;
@end

static IInspector *getInstance()
{
  return &facebook::react::getInspectorInstance();
}

@implementation RCTInspector

RCT_NOT_IMPLEMENTED(- (instancetype)init)

+ (NSArray<RCTInspectorPage *> *)pages
{
  std::vector<InspectorPage> pages = getInstance()->getPages();
  NSMutableArray<RCTInspectorPage *> *array = [NSMutableArray arrayWithCapacity:pages.size()];
  for (size_t i = 0; i < pages.size(); i++) {
    RCTInspectorPage *pageWrapper = [[RCTInspectorPage alloc] initWithId:pages[i].id
                                                                   title:@(pages[i].title.c_str())];
    [array addObject:pageWrapper];

  }
  return array;
}

+ (RCTInspectorLocalConnection *)connectPage:(NSInteger)pageId
                         forRemoteConnection:(RCTInspectorRemoteConnection *)remote
{
  auto localConnection = getInstance()->connect(pageId, std::make_unique<RemoteConnection>(remote));
  return [[RCTInspectorLocalConnection alloc] initWithConnection:std::move(localConnection)];
}

@end

@implementation RCTInspectorPage

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (instancetype)initWithId:(NSInteger)id
                     title:(NSString *)title
{
  if (self = [super init]) {
    _id = id;
    _title = title;
  }
  return self;
}

@end

@implementation RCTInspectorLocalConnection

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (instancetype)initWithConnection:(std::unique_ptr<ILocalConnection>)connection
{
  if (self = [super init]) {
    _connection = std::move(connection);
  }
  return self;
}

- (void)sendMessage:(NSString *)message
{
  _connection->sendMessage([message UTF8String]);
}

- (void)disconnect
{
  _connection->disconnect();
}

@end

#endif
