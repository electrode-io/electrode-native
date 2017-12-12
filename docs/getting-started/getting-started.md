{% method %}
## Getting started with Electrode Native

The Getting Started tutorial walks you through creating a simple movie application using Electrode Native.  
{% sample lang="android" %}  
We'll use Android for this tutorial. If you wish to use iOS instead, click the iOS tab on the top-right of this page.  
{% sample lang="ios" %}  
We'll use iOS for this tutorial. If you wish to use Android instead, click the Android tab on the top-right of this page.  
{% common %}  
The movie application includes two React Native MiniApps and two APIs:

- **MovieListMiniApp** | This MiniApp displays a list of movies.
- **MovieDetailsMiniApp** | This MiniApp displays the details of a selected movie.
- **MoviesApi** | An API used to retrieve a list of movies.
- **NavigationApi** | An API used to navigate from one MiniApp to another.

The tutorial shows how easy it is to integrate multiple React Native applications into a native application, and how to easily communicate between the JavaScript and the native side using APIs.

## Before you begin
{% sample lang="android" %}

- Install [Android Studio](https://developer.android.com/studio/index.html) and [Electrode Native](https://electrode.gitbooks.io/electrode-native/#installation) if they're not already installed.
- Download Android 7.0 (Nougat) and accept it's license:
    1. In Android Studio go to Tools → Android → SDK Manager
    2. Select the “Android 7.0 (Nougat)” checkbox
    3. Click “Apply” and follow the prompts:

    ![Android Studio SDK Manager download](/images/AndroidStudioSDKManager.jpg)

    The manager will download all the dependencies:
- Set up an emulator if you want to run the application in an emulator.
For more information on how to setup an emulator, you can check [the Android documentation](https://developer.android.com/studio/run/managing-avds.html)
{% sample lang="ios" %}
-  Install [Xcode](https://developer.apple.com/xcode/) and [Electrode Native](https://electrode.gitbooks.io/electrode-native/#installation) if they're not already installed.
{% common %}
- Create a working directory named `ElectrodeNativeTutorial` to hold all tutorial project files

## Creating the MovieList MiniApp

1) Move to the working directory and create a MiniApp named `MovieListMiniApp` using the `ern create-miniapp` command.

```bash
$ cd ElectrodeNativeTutorial
$ ern create-miniapp MovieListMiniApp
```  

2) When asked to enter a package name for this MiniApp, hit enter to use the default name. You may check the [package name requirements](https://docs.npmjs.com/files/package.json#name)

3) Move to the `MovieListMiniApp` directory and run the MiniApp to view it, using the `ern run` command.  

{% sample lang="android" %}
```bash
$ cd MovieListMiniApp
$ ern run-android
```  

{% sample lang="ios" %}
```bash
$ cd MovieListMiniApp
$ ern run-ios
```
{% sample lang="android" %}

4) First time users will need to grant the `SYSTEM_ALERT_WINDOW` permission for ErnRunner app . ([Learn More](https://developer.android.com/reference/android/Manifest.permission.html#SYSTEM_ALERT_WINDOW)).
Once done exit from the ErnRunner app and launch it again from applications.

![Overlay Permission Window](/images/OverlayPermissionWindow.png) ![Select ErnRunner](/images/ErnRunnerSelected.png)

{% sample lang="android" %}

5) Select an emulator (or device) from the list when prompted.

{% sample lang="ios" %}

4) Select a simulator from the list when prompted.

{% common %}

Once the command completes, you will see your first MiniApp running. If you used React Native previously, you'll notice that this MiniApp is the same as the React Native default starter app--after all, a MiniApp is nothing more than a React Native application!

Now let's update the UI of this MiniApp to display a list of movies.

## Updating the MovieList MiniApp UI
 
1) Open the `App.js` file in your favorite JavaScript editor.  

2) Replace the content of this source file with the following code.

```javascript
/**
 * @flow
 */

import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableHighlight
} from 'react-native'

export default class MovieListMiniApp extends Component {

  _keyExtractor = (item, index) => item.title;

  constructor () {
    super()
    this.state = {
      movies: [{
        title: 'The Fast and Furious',
        releaseYear: 2010,
        ratings: '4.5',
        imageUrl: 'http://bit.ly/2jRUZwE',
        description: 'The Fast and the Furious'
      }, {
        title: '2 Fast 2 Furious',
        releaseYear: 2011,
        ratings: '4.0',
        imageUrl: 'http://bit.ly/2jTfYPF',
        description: 'How fast do you like it ?'
      }]
    }
  }

  render () {
    return (
      <FlatList
        style={styles.container}
        data={this.state.movies}
        keyExtractor={this._keyExtractor}
        renderItem={({item}) =>
          <View style={styles.row}>
            <Image
              style={styles.icon}
              source={{
                uri: item.imageUrl ? item.imageUrl : 'http://bit.ly/2yz3AYe'
              }}
            />
            <View style={styles.row2}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.releaseYear}</Text>
            </View>
          </View>
        }
      />
    )
  }
  

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    padding: 5,
    backgroundColor: 'black'
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12
  },
  row2: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12
  },
  title: {
    fontSize: 20,
  },
  subtitle: {
    paddingTop: 5,
    flex: 1,
    fontSize: 12
  },
  icon: {
    width: 50,
    height: 70,
    flexShrink: 1,
    alignSelf: 'center'
  }
})
```

{% sample lang="ios" %}
3) Save your changes to `App.js` and reload the application to see the updated UI. Hit ⌘ + R in your iOS Simulator to reload the app and see your changes.
{% sample lang="android" %}
3) Save your changes to `App.js` and reload the application to see the updated UI. Press the R key twice or select Reload from the Developer Menu (⌘M).

{% common %}
Congratulations! You've successfully run and modified the initial UI of the MovieList MiniApp.

Now let's add an API to the MiniApp so that we can retrieve movies from the native application instead of manually hard coding them in the source code of our MiniApp.

## Adding the MoviesApi to the MovieList MiniApp

We have already created and published the `MoviesApi` and a native implementation of the api for the needs of this tutorial.
You may view the created API code in [react-native-ernmovie-api](https://github.com/electrode-io/react-native-ernmovie-api) repository and the implementation code in [ReactNativeErnmovieApiImpl](https://github.com/electrode-io/ReactNativeErnmovieApiImpl) repository.
We also created a `NavigationApi` that will be of use later in this tutorial, you can view its code in the [react-native-ernnavigation-api](https://github.com/electrode-io/react-native-ernnavigation-api) repository.

1) Add the `MoviesApi`, the `MoviesApiImpl`, the `NavigationApi` and [react-native-electrode-bridge](https://github.com/electrode-io/react-native-electrode-bridge) as dependencies of MovieListMiniApp, using the `ern add` command.

```bash
$ ern add react-native-ernmovie-api-impl react-native-ernnavigation-api react-native-electrode-bridge
```

2) Open the `App.js` file and modify it as described in the next steps.

3) Import MoviesApi and add it below other `import` statements of the JavaScript file:

```javascript
import { MoviesApi } from 'react-native-ernmovie-api'
```

4) Replace the constructor method with the following code:

```javascript
constructor () {
  super()

  MoviesApi.requests().getTopRatedMovies().then((movies) => {
    if (movies) {
      this.setState(previousState => {
        return {movies}
      })
    }
  }).catch(error => {
    let movies = [{
      title: 'Titanic',
      releaseYear: 1997,
      ratings: '4.5',
      imageUrl: 'http://bit.ly/2hnU8mq',
      description: 'Titanic'
    }, {
      title: 'Avatar',
      releaseYear: 2009,
      ratings: '4.0',
      imageUrl: 'http://bit.ly/2xAX0Cv',
      description: 'Avatar'
    }]

    this.setState(previousState => {
      return {movies}
    })
  })

  this.state = {
    movies: []
  }
}
```
5) Save the `App.js` file

6) Because we added an API, that contains some native code, we'll need to regenerate the container used by the native application, in order for it to include the native code of the API. This can be done using the `run` command which recreates a new local container and launches the application.
Enter the following `run` command:

{% sample lang="android" %}  
```bash
$ ern run-android
```
{% sample lang="ios" %}  
```bash
$ ern run-ios
```
{% common %}

The UI displays the movie names that are returned by the native implementation of the movie api.

## Using the Navigation API

We will use the `NavigationApi` that we already added to our MiniApp earlier on. This very simple API will be used for navigating from the `MovieListMiniApp` to the `MovieDetailsMiniApp`.

1) Mofify the `App.js` file as follows so that when selecting a movie in the list, the `MovieListMiniApp` will call the navigation API to navigate to the `MovieDetailsMiniApp` to display the details of the selected Movie.

2) Add the following import statement:

```javascript
import { NavigationApi } from 'react-native-ernnavigation-api'
```

3) Replace the `render` method with the following method:

```javascript
render () {
  return (
    <FlatList
      style={styles.container}
      data={this.state.movies}
      keyExtractor={this._keyExtractor}
      renderItem={({item}) =>
      <TouchableHighlight onPress={() => this._onPressRow(item)} underlayColor="gray">
        <View style={styles.row} onPress={() => this._onPressRow(item)}>
          <Image
            style={styles.icon}
            source={{
              uri: item.imageUrl ? item.imageUrl : 'http://bit.ly/2yz3AYe'
            }}
          />
          <View style={styles.row2}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.releaseYear}</Text>
          </View>
        </View>
        </TouchableHighlight>}
    />
  )
}
```  

4) Add a method below the `render` method to send the `navigate` request when a movie is selected in the list of movies

```javascript
_onPressRow (movie) {
   movie.isSelect = !movie.isSelect
   NavigationApi.requests().navigate('MovieDetailsMiniApp', {'initialPayload': JSON.stringify(movie)}).catch(() => {
     console.log("Navigation failed.");
   })
 }
```

5) Save your modification to the `App.js` file

6) Implement the `NavigationApi` in the native application, as we did for the `MovieApi`.

{% sample lang="android" %}  
* Replace the content of `MainActivity.java` with the following code:

```java
package com.walmartlabs.ern;

import android.content.Intent;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import com.ernnavigation.ern.api.NavigateData;
import com.ernnavigation.ern.api.NavigationApi;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.ern.container.ElectrodeMiniAppActivity;
import com.walmartlabs.ern.container.miniapps.MiniAppsConfig;
import com.walmartlabs.ern.container.miniapps.MovieListMiniAppActivity;

// This is the main activity that gets launched upon app start  
// It just launches the activity containing the miniapp  
// Feel free to modify it at your convenience.  
public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        getIntent().getBundleExtra("data");

        Intent i = new Intent(this, MovieListMiniAppActivity.class);
        this.startActivity(i);

        NavigationApi.requests().registerNavigateRequestHandler(new ElectrodeBridgeRequestHandler<NavigateData, Boolean>() {
            @Override
            public void onRequest(@Nullable NavigateData navigateData, @NonNull ElectrodeBridgeResponseListener<Boolean> responseListener) {
                if (!MainActivity.this.isFinishing()) {
                    if (navigateData != null) {
                        Class activityClass = MiniAppsConfig.MINIAPP_ACTIVITIES.get(navigateData.getminiAppName());
                        if (activityClass != null) {
                            Bundle bundle = new Bundle();
                            bundle.putString("payload", navigateData.getinitialPayload());
                            Intent intent = new Intent(MainActivity.this, activityClass);
                            ElectrodeMiniAppActivity.addInitialProps(intent, bundle);
                            MainActivity.this.startActivity(intent);
                        } else {
                            Toast.makeText(MainActivity.this, "No activity found to navigate for: " + navigateData.getminiAppName(), Toast.LENGTH_LONG).show();
                        }
                    } else {
                        Log.e("NAVIGATION", "Not enough data provided to navigate");
                    }
                }
            }
        });
    }
}
```
{% sample lang="ios" %}
* Add the following implementation inside the `ViewController.m` file below `[super viewDidLoad];`.  

```objectivec
 NavigationAPI *navigationAPI = [[NavigationAPI alloc] init];
    [navigationAPI.requests registerNavigateRequestHandlerWithHandler:^(id  _Nullable data, ElectrodeBridgeResponseCompletionHandler  _Nonnull block) {
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];

        NavigateData *navData = (NavigateData *)data;
        NSMutableDictionary *initialPapyload = [[NSMutableDictionary alloc]init];
        [initialPapyload setObject:navData.initialPayload forKey:@"payload"];

        UIViewController *viewController = [[ElectrodeReactNative sharedInstance] miniAppWithName:navData.miniAppName properties:initialPapyload];
        viewController.view.frame = [UIScreen mainScreen].bounds;
        [viewController setTitle:@"MovieDetails MiniApp"];


        UINavigationController *navController = (UINavigationController *) appDelegate.window.rootViewController;
        [navController pushViewController:viewController animated:NO];

        block(nil, nil);
    }];
```  

* Make sure that you add the `appDelegate` import statement to `ViewController.m` file as well.  

```objectivec
#import "AppDelegate.h"
```
{% common %}  

## Adding the MovieDetailsMiniApp

To complete the tutorial, add the `MovieDetailsMiniApp` to the application.

We've developed and published this MiniApp to reuse it in this tutorial. You may view the code of this MiniApp in the [MovieDetailsMiniApp repository](https://github.com/electrode-io/MovieDetailsMiniApp).

* To add this MiniApp to the local container used by the native application, use a variation of the `ern run` command that allows you to include extra MiniApps to the local Container. Let's do that magic now.  

{% sample lang="android" %}  
```bash
$ ern run-android --miniapps moviedetailsminiapp --mainMiniAppName MovieListMiniApp
```  
{% sample lang="ios" %}  
```bash
$ cd MovieListMiniApp //make sure you are in root dir of MovieListMiniApp
$ ern run-ios --miniapps moviedetailsminiapp --mainMiniAppName MovieListMiniApp
```  

{% common %}
Once the app is launched click on any movie and you will be taken to the details page of MovieDetailsMiniApp.

This is how easy it is to combine multiple MiniApps in a local container!

You've successfully used Electrode Native to build your first native application, composed of multiple MiniApps.

In this tutorial, we've covered only a small part of what Electrode Native offers. Be sure to check the rest of the Electrode Native documentation to learn about all the features that Electrode Native offers.


{% endmethod %}
