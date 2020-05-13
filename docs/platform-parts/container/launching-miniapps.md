#### Android

When a Container is generated, it will create one Activity for each MiniApp included in the container. For example, if you have a MiniApp named `Hello`, the container will create an Activity-extending class named `HelloActivity`. It will also be declared in the `AndroidManifest.xml` file of the container so that you can launch it from your mobile application without extra setup.

All of these activities are stored in the `com.walmartlabs.ern.container.miniapps` namespace.

To launch a MiniApp, all you have to do then, is start its corresponding Activity.  
You can also pass initial properties to a MiniApp, which will be provided to the JavaScript MiniApp as properties in the `componentWillMount` React lifecycle. This might be useful if the MiniApp needs data when first launched.

- Call the following static method of the `ElectrodeMiniAppActivity` class.  
  The first parameter is the Intent instance that you will pass to `startActivity`, while the second parameter is a Bundle instance containing the data to provide to the MiniApp as key:value pairs.

```java
public static void addInitialProps(@NonNull Intent intent, @NonNull Bundle bundle)
```

The generated Activities are very basic, and might not fulfill more advanced needs. If you need to use your own Activity subclass to host a MiniApp, you can directly extend the `ElectrodeMiniAppActivity` class and override the methods to your needs.

**Note** Be sure to override the following method and return the String corresponding to the MiniApp name hosted by this Activity--using the previous example, we would return "Hello".

```java
protected String getMiniAppName()
```

If you cannot extend your own Activity from this one (you might already have a deep inheritance chain and Java does not support multiple inheritance) but roll your own, or host the MiniApp in a Fragment instead, then you'll need to use `ElectrodeMiniAppActivity` as a template to roll your own class.

#### iOS

When a Container is generated, it provides one `UIViewController` for each MiniApp included in the Container. For example, if you have a MiniApp named Hello, the container will create a `UIViewController` that contains the Hello miniapp--and it's the same `UIViewController` that you are already familiar with.

To launch a MiniApp, all you have to do then, is

- Present its corresponding `UIViewController` by calling `[[ElectrodeReactNative sharedInstance] miniAppWithName:@"<your-mini-app-name>" properties:nil]`

- You can also pass initial properties to a MiniApp, which will be provided to the JavaScript MiniApp as properties in the `componentWillMount` React lifecycle. This might be useful if the MiniApp needs data when first launched. To do this, pass an `NSDictionary` to the parameter `property`.

The generated `UIViewController` is basic and might not fulfill your advanced needs. If you would like to use your own subclass of the `UIViewController`, you must override `viewDidLoad:` in your `UIViewController` as shown below:

```objectivec
- (void)viewDidLoad {
    [super viewDidLoad];
    UIViewController *viewController =
    [[ElectrodeReactNative sharedInstance] miniAppWithName:@"<YourMiniAppName>" properties:nil];
    viewController.view.frame = [UIScreen mainScreen].bounds;
    [self.view addSubview:viewController.view];
}
```
