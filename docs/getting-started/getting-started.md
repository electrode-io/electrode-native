{% method %}
{% common %}
## Getting started with Electrode Native

This tutorial will walk you through creating a simple Movie aplication using `Electrode Native`.  
{% sample lang="android" %}
We'll use Android for this tutorial. If you wish to use iOS instead, please click the iOS tab on the top right of this page.
{% sample lang="ios" %}
We'll use iOS for this tutorial. If you wish to use Android instead, please click the Android tab on the top right of this page.
{% common %}
This application will be composed of two React Native MiniApps:

- **MovieListMiniApp** : This MiniApp will display a list of movies.
- **MovieDetailsMiniApp** : This MiniApp will show the details of a movie.

And two APIs:

- **MoviesApi** : An API to retrieve a list of movies.
- **NavigationApi** : An API to navigate from one MiniApp to another.

This will show you how easy it is to integrate multiple React Native applications into a native application, and how to easily communicate between the JavaScript and the native side using APIs.

## Before you begin
{% sample lang="android" %}
- If not already done, install [Android Studio](https://developer.android.com/studio/index.html) and [Electrode Native](https://electrode.gitbooks.io/electrode-native/#installation).

- If you want to run the application in an emulator, make sure you have created one.
For more information on how to setup an emulator, you can check [the Android documentation](https://developer.android.com/studio/run/managing-avds.html)
{% sample lang="ios" %}
-  If not already done, install [Xcode](https://developer.apple.com/xcode/) and [Electrode Native](https://electrode.gitbooks.io/electrode-native/#installation).
{% common %}
- Create a working directory named `ElectrodeNativeTutorial` to hold all tutorial project files

## Creating the MovieList MiniApp

- Move to the working directory and create a MiniApp named `MovieListMiniApp` using `ern create-miniapp` command.

```bash
$ cd ElectrodeNativeTutorial
$ ern create-miniapp MovieListMiniApp
```
When asked to enter a package name for this MiniApp, just hit enter to use the default one. You may check the [package name requirements](https://docs.npmjs.com/files/package.json#name)

- Move to the `MovieListMiniApp` directory and run the MiniApp to see how it looks like, using `ern run` command.

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
First time users please grant the `SYSTEM_ALERT_WINDOW` permission. [Learn More](https://developer.android.com/reference/android/Manifest.permission.html#SYSTEM_ALERT_WINDOW)
![Overlay Permission Window](/images/OverlayPermissionWindow.png)
![Select ErnRunner](/images/ErnRunnerSelected.png)

{% common %}

Pick one emulator (or device) from the list when prompted.
Once the command completes, you will see your first MiniApp running. If you have already used React Native, you'll notice that this MiniApp is just the same as the React Native default starter app. After all, a MiniApp is nothing more than a React Native application !

Now let's update the UI of this MiniApp for it to display a list of movies.

## Updating the MovieList MiniApp UI

{% sample lang="android" %}
- Open`index.android.js` in your favorite JavaScript editor
{% sample lang="ios" %}
- Open `index.ios.js` in your favorite JavaScript editor

{% common %}
- Replace the whole content of this source file with the following code.

```javascript
/**
 * @flow
 */

import React, { Component } from 'react'
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ListView,
  Image,
  TouchableHighlight
} from 'react-native'

export default class MovieListMiniApp extends Component {

  constructor () {
    super()
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    this.state = {
      dataSource: ds.cloneWithRows([{
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
      }
      ])
    }
  }

  render () {
    return (
      <ListView
        style={styles.container}
        dataSource={this.state.dataSource}
        renderRow={(movie) =>
          <View style={styles.row}>
            <Image
              style={styles.icon}
              source={{
                uri: movie.imageUrl ? movie.imageUrl : 'http://bit.ly/2yz3AYe'
              }}
            />
            <View style={styles.row2}>
              <Text style={styles.title}>{movie.title}</Text>
              <Text style={styles.subtitle}>{movie.releaseYear}</Text>
            </View>
          </View>
        }
        renderSeparator={(sectionId, rowId) => <View key={rowId} style={styles.separator}/>}
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
  listview: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 20,
  },
  subtitle: {
    paddingTop: 5,
    flex: 1,
    fontSize: 12
  },
  separator: {
    flex: 1,
    height: 0,
    paddingTop: 2,
    paddingBottom: 2
  },
  icon: {
    width: 50,
    height: 70,
    flexShrink: 1,
    alignSelf: 'center'
  }
})

AppRegistry.registerComponent('MovieListMiniApp', () => MovieListMiniApp)
```

- Reload the application to see the updated UI.

Inside the emulator window or on you device, do the following

{% sample lang="android" %}
```
CMD+M --> Reload
```
{% sample lang="ios" %}
```
CMD+M
```
{% common %}

You will see the initial UI of the MovieList MiniApp.  

Now let's add an API to this MiniApp so that we can retrieve movies from the native application instead of manually hardcoding them in the source code of our MiniApp.

## Adding the MoviesApi to the MovieList MiniApp

We have already created and published the MoviesApi for the needs of this tutorial. If you want to take a look at the generated API code, you can have a look to the [react-native-ernmovie-api](https://github.com/electrode-io/react-native-ernmovie-api) where we keep this API.

- Using `ern add` command, add the MoviesApi

```bash
$ ern add react-native-ernmovie-api
$ ern add react-native-electrode-bridge
```

This will install the MoviesApi from NPM and add it as a dependency of your MiniApp. We also need to add the bridge, because it is not a direct dependency of APIs.

- Update the MovieList MiniApp code to use the API

{% sample lang="android" %}
Open the `index.android.js` file and modify it as follow
{% sample lang="ios" %}
Open the `index.ios.js` file and modify it as follow
{% common %}
Add the following `import` statement under other `import` statements located at the top of the JavaScript file:

```javascript
import { MoviesApi } from 'react-native-ernmovie-api'
```

Then, just replace the constructor method with the following code:

```javascript
   constructor () {
     super()
     const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})

     let topMovies = []
     MoviesApi.requests().getTopRatedMovies().then((movies) => {
       if (movies) {
         this.setState(previousState => {
           return {dataSource: ds.cloneWithRows(movies)}
         })
       }
     }).catch(error => {
       topMovies = [{
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
         return {dataSource: ds.cloneWithRows(topMovies)}
       })
     })

     this.state = {
       dataSource: ds.cloneWithRows(topMovies)
     }
   }
```

- Relaunch the application

Because we added an API, that contains some native code, we'll need to regenerate the Container used by the native application, for it to include the native code of the API. This can be done by the run command which will recreate a new local Container and launch the application.

{% sample lang="android" %}
```bash
$ ern run-android
```
{% sample lang="ios" %}
```bash
$ ern run-ios
```
{% common %}

You can see that the UI is showing the movie names that are set in the `catch` block.
This means there was no API implementation available to serve the `getTopRatedMovies` request.

Let's now see write an implementation of this API. Although you can write the implementation either on the JavaScript side or Native side, this tutorial shows the implementation on the native side.

### Implementing the MovieApi on the native side

{% sample lang="android" %}
- Open `MainApplication.java` in your favorite IDE (this file is located in `android/app/src/main/java/com/walmartlabs/ern/`), or just open the Android project (in `android/`) in Android Studio to edit this file.

- Replace `MainApplication.java` code with the following

```java
package com.walmartlabs.ern;

import android.app.Application;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.ernmvoie.ern.api.MoviesApi;
import com.ernmvoie.ern.model.Movie;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import com.walmartlabs.ern.container.ElectrodeReactContainer;

import java.util.ArrayList;
import java.util.List;

public class MainApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();

        ElectrodeReactContainer.initialize(this,
          new ElectrodeReactContainer.Config().isReactNativeDeveloperSupport(RunnerConfig.RN_DEV_SUPPORT_ENABLED));

        MoviesApi.requests().registerGetTopRatedMoviesRequestHandler(new ElectrodeBridgeRequestHandler<None, List<Movie>>() {
            @Override
            public void onRequest(@Nullable None payload, @NonNull ElectrodeBridgeResponseListener<List<Movie>> responseListener) {
              List<Movie> movies = new ArrayList<Movie>() {{
                add(new Movie.Builder("1", "The Shawshank Redemption").releaseYear(1994).rating(5f).imageUrl("http://bit.ly/2xZm1Zr").build());
                add(new Movie.Builder("2", "The Godfather").releaseYear(1972).rating(4.9f).imageUrl("http://bit.ly/2wK5TuA").build());
                add(new Movie.Builder("3", "The Godfather: Part II ").releaseYear(1974).rating(4f).imageUrl("http://bit.ly/2yysiIA").build());
                add(new Movie.Builder("4", "The Dark Knight").releaseYear(2008).rating(4f).imageUrl("http://bit.ly/2iZPBqw").build());
                add(new Movie.Builder("5", "12 Angry Men").releaseYear(1957).rating(3f).imageUrl("http://bit.ly/2xwkt7r").build());
              }};
              responseListener.onSuccess(movies);
            }
        });
    }
}
```
- Relaunch the application

If you are using android studio you can run the app directly from there or by running the command below.

```bash
$ ern run-android
```

{% sample lang="ios" %}
- Open the generated ios project (in `ios` folder) in XCode.

- Replace the `ViewController.m` code with the following code.

```objectivec
#import "ViewController.h"
#import "RunnerConfig.h"
#import <ElectrodeContainer/ElectrodeContainer.h>

@interface ViewController ()
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    MoviesAPI* moviesApi = [[MoviesAPI alloc] init];

    [moviesApi.requests registerGetTopRatedMoviesRequestHandlerWithHandler:^(id  _Nullable data, ElectrodeBridgeResponseCompletionHandler  _Nonnull block) {
        NSMutableArray<Movie *> *movies = [[NSMutableArray alloc] init];

        [movies addObject:[self createMovie:@"1" title:@"The Shawshank Redemption" releaseYear:@1994 rating:@9.2 imageUrl:@"http://bit.ly/2xZm1Zr"]];
        [movies addObject:[self createMovie:@"2" title:@"The Godfather" releaseYear:@1972 rating:@9.2 imageUrl:@"http://bit.ly/2wK5TuA"]];
        [movies addObject:[self createMovie:@"3" title:@"The Godfather: Part II" releaseYear:@1974 rating:@9 imageUrl:@"http://bit.ly/2yysiIA"]];
        [movies addObject:[self createMovie:@"4" title:@"The Dark Knight" releaseYear:@2008 rating:@9 imageUrl:@"http://bit.ly/2iZPBqw"]];
        [movies addObject:[self createMovie:@"5" title:@"12 Angry Men" releaseYear:@1957 rating:@8.9 imageUrl:@"http://bit.ly/2xwkt7r"]];

        block(movies, nil);
    }];

   UIViewController *viewController =
   [[ElectrodeReactNative sharedInstance] miniAppWithName:MainMiniAppName properties:nil];
   [viewController setTitle:@"Top Movies List"];
   viewController.view.frame = [UIScreen mainScreen].bounds;
   [self pushViewController:viewController animated:NO];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
}

- (Movie *) createMovie : (NSString*) movieId title: (NSString*) title releaseYear: (NSNumber*) releaseYear rating: (NSNumber*) rating imageUrl: (NSString*) imageUrl {

    NSMutableDictionary* movieDict = [[NSMutableDictionary alloc]init];
    [movieDict setObject:movieId forKey:@"id"];
    [movieDict setObject:title forKey:@"title"];
    [movieDict setObject:releaseYear forKey:@"releaseYear"];
    [movieDict setObject:imageUrl forKey:@"imageUrl"];

    Movie *movie =[[Movie alloc] initWithDictionary:movieDict];
    return movie;
}

@end

```

- Relaunch the application

You can launch the app directly from xcode or by running the command below

```bash
$ ern run-ios
```

{% common %}
You will see that the UI now shows the movies that are stored in the native application.

## Adding the Navigation API

We have created this API for you for this tutorial, if you wish to have a look to it, you can see it in [this GitHub repository](https://github.com/electrode-io/react-native-ernnavigation-api). This very simple API will be used to navigation from the `MovieListMiniApp` to the `MovieDetailsMiniApp`.

- Add the NavigationAPI to the `MovieListMiniApp`.

```bash
$ ern add react-native-ernnavigation-api
```
{% sample lang="android" %}
- Mofify `index.android.js` file as follow, so that when selecting a movie in the list, the `MovieListMiniApp` will call the navigation API to navigate to the `MovieDetailsMiniApp` for this movie.
{% sample lang="ios" %}
- Modify `index.ios.js` file as follow, so that when selecting a movie in the list, the `MovieListMiniApp` will call the navigation API to navigate to the `MovieDetailsMiniApp` for this movie.
{% common %}
First, add the following import statement:

```javascript
import { NavigationApi } from 'react-native-ernnavigation-api'
```

And then just replace the `render` method with the following one:

```javascript
  render () {
    return (
      <ListView 
        style={styles.container} 
        dataSource={this.state.dataSource}
        renderRow={(movie) =>
        <TouchableHighlight onPress={() => this._onPressRow(movie)} underlayColor="grey">
          <View style={styles.row} onPress={() => this._onPressRow(movie)}>
            <Image
              style={styles.icon}
              source={{
                uri: movie.imageUrl ? movie.imageUrl : 'http://bit.ly/2yz3AYe'
              }}
            />
            <View style={styles.row2}>
              <Text style={styles.title}>{movie.title}</Text>
              <Text style={styles.subtitle}>{movie.releaseYear}</Text>
            </View>
          </View>
        </TouchableHighlight>
        }
        renderSeparator={(sectionId, rowId) => <View key={rowId} style={styles.separator}/>}
      />
    )
  }
```

We'll also add a method, below the `render` method to send the `navigate` request whn a movie is selected in the list of movies :

```javascript
  _onPressRow (movie) {
    movie.isSelect = !movie.isSelect
    NavigationApi.requests().navigate('MovieDetailsMiniApp', {'initialPayload': JSON.stringify(movie)}).catch(() => {
      console.log("Navigation failed.");
    })
  }
```

- Implement the `NavigationAPI`

The `navigate` method of the `NavigationApi` is not yet implemented. We'll implement it in the native application, as we did for the `MovieApi`.

{% sample lang="android" %}
Replace the `MainActivity.java` whole content with the following:

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
Replace the content of `ViewController.h` as below,

```objectivec
#import <UIKit/UIKit.h>

@interface ViewController : UINavigationController

@end
```

Add the following implementation inside `ViewController.m` right below the movie api implementation.

```objectivec
 NavigationAPI *navigationAPI = [[NavigationAPI alloc] init];
    [navigationAPI.requests registerNavigateRequestHandlerWithHandler:^(id  _Nullable data, ElectrodeBridgeResponseCompletionHandler  _Nonnull block) {
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];

        NavigateData *navData = (NavigateData *)data;
        NSMutableDictionary *initialPapyload = [[NSMutableDictionary alloc]init];
        [initialPapyload setObject:navData.initialPayload forKey:@"payload"];

        UIViewController *viewController = [[ElectrodeReactNative sharedInstance] miniAppWithName:navData.miniAppName properties:initialPapyload];
        viewController.view.frame = [UIScreen mainScreen].bounds;

        UINavigationController *navController = (UINavigationController *) appDelegate.window.rootViewController;
        [navController pushViewController:viewController animated:NO];

        block(nil, nil);
    }];
```

Ensure that you add the `appDelegate` import statement to `ViewController.m` file as well

```objectivec
#import "AppDelegate.h"
```
{% common %}
## Adding the MovieDetailsMiniApp

All that remains now is to add the `MovieDetailsMiniApp` to our application.

We've developed and published this MiniApp so you can just reuse it. If you want to have a look at the code of this MiniApp, you can see it in [this GitHub repository](https://github.com/electrode-io/MovieDetailsMiniApp)

We can simply add this MiniApp to the local Container used by the native application, using a variation of the `ern run` command that allows to include extra MiniApps to the local Container.

Let's do that magic now.
{% sample lang="android" %}
```bash
$ ern run-android --miniapps moviedetailsminiapp --mainMiniAppName MovieListMiniApp
```
{% sample lang="ios" %}
```bash
$ ern run-ios --miniapps moviedetailsminiapp --mainMiniAppName MovieListMiniApp
```
{% common %}
This is how easy it is to combine multiple MiniApps in a local Container.

There you go !

You've successfully used `Electrode Native` to build your first native application, composed of multiple MiniApps.

In this tutorial, we've only covered a small part of what `Electrode Native` offers. 

```
TODO : <add What's next?...or lead them into the next section>
```

{% endmethod %}
