##ElectrodePluginConfigurator

Implement this protocol if your mini-app needs CodePush support. 

#### Initialization

```initWithPlist: (NSString *)plist```  initialize an instance of your class by using key-value in your plist. This plist includes configuration for you to setup CodePush.  
- `(NSString *)plist`: the path of your plist.   

Here’s a list of keys that can be used in your plist. 

- `DebugEnabledConfig` set if debug mode is enabled. Default to NO.    
- `CodePushConfigServerUrl` serverURL where all the JSBundle could be found. Defaults to ```https://codepush.azurewebsites.net/```.  
- `ERNCodePushConfigDeploymentKey` your miniApp deployment key.  

#### Access Config
- `isDebugEnabled` return true if debug is enabled for current config.  
- `codePushWithServerURLString` return URL for JSBundle under current config.  
- `codePushWithIDString`  return deployment key.
