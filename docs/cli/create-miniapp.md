**Creates a `MiniApp`**

### Caveats

You should not use any special characters for your `MiniApp` name.  
Please also note that dashes (`-`) cannot be used.

### Commands

#### `ern create-miniapp <appName>`

This will create a new `MiniApp` in a new directory having the same name as the `MiniApp` one.

#### `ern create-miniapp <appName> --scope <scope>`

Use a specific npm scope for the `MiniApp` package.

#### `ern create-miniapp <appName> --platformVersion <version>`

Use a specific platform version, other than the currently activated one, to create the `MiniApp`.