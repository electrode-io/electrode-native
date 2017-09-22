# Getting started

This guide will walk you through steps to build react native apps using ern platform and other features that the platform offers.

For the purpose of the tutorial, we are going to create a Movie application that lists top rated movies and clicking on any movie will take the user to the details page. Let's break this down into two miniapps.

1. MovieListMiniApp: To list the top movies.
2. MovieDetailsMiniApp: Show the details of a movie.

This will help us understand how easy it is to integrate multiple react native applications into a native application. Let's get started.


Before we start, we assume that you have already completed the electrode react native platform setup. If not please follow the instructions [here](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/ern-platform/wiki/Getting-started) before proceeding with the getting started guide.

## Creating your first Miniapp

Lets first create a MiniApp using ern platform.  
Now would be a good time to create a working directory for keeping all the projects that we are going to create using the platform.  
Once you have your work directory, just `cd` into it:

```bash
$ cd <your-working-directory>
```

and run the following `ern` command to create a new MiniApp. We'll name this one as `MovieListMiniApp`.

```bash
$ ern create-miniapp MovieListMiniApp
```

The MiniApp will be created in a new directory `MovieListMiniApp`.
Now let's try to run it and see how it looks on an Android or iOS device.   
The assumption is that you have already setup Android or iOS emulator/simulator, if not please proceed [here]() to complete the setup.

## Launching the Miniapp

Just `cd` into the `MovieListMiniApp` MiniApp directory:

```bash
$ cd MovieListMiniApp
```

And then launch the MiniApp using `ern`:

```
Android:
$ ern run-android

iOS:
$ ern run-ios
```

Please pick one emulator or device when prompted.   
Once `ern` command execution is complete, you will see your first `MovieListMiniApp` MiniApp running. If you have already used React Native, you'll notice that this MiniApp is just the same as the React Native default starter app.

## Creating the Miniapp UI

Now let's make it an app that lists top movies.  
Open `index.android.js` or `index.ios.js` in your favorite JavaScript editor and just replace all of the code in this file, with the following code:

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
        imageUrl: `https://images-na.ssl-images-amazon.com/images/M/MV5BNzlkNzVjMDMtOTdhZC00MGE1LTkxODctMzFmMjkwZmMxZjFhXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SY1000_CR0,0,672,1000_AL_.jpg`,
        description: 'The Fast and the Furious'
      }, {
        title: '2 Fast 2 Furious',
        releaseYear: 2011,
        ratings: '4.0',
        imageUrl: `https://images-na.ssl-images-amazon.com/images/M/MV5BMzExYjcyYWMtY2JkOC00NDUwLTg2OTgtMDI3MGY2OWQzMDE2XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SY1000_CR0,0,666,1000_AL_.jpg`,
        description: 'How fast do you like it ?'
      }
      ]),
    }
  }

  render () {
    return (
      <ListView style={styles.container} dataSource={this.state.dataSource}
                renderRow={(movie) =>
                  <View style={styles.row}>
                    <Image
                      style={styles.icon}
                      source={{
                        uri: movie.imageUrl ? movie.imageUrl : 'http://image10.bizrate-images.com/resize?sq=60&uid=2216744464?odnHeight=100&odnWidth=100&odnBg=FFFFFF'
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

Once done, let's reload the MiniApp in the emulator/simulator, for it to pick up the new code. 

```
Android: CMD+M --> Reload
IOS: CMD+M
```

You can now see the initial UI of the `MovieListMiniApp`.

## Retrieving Movies from the Native side

Let's now add an API so that we can fetch some movie names provided by the native app instead of hard coding them inside `index.android/ios.js`

```bash
$ cd ../MovieListMiniApp
$ ern add react-native-ernmovie-api
$ ern add react-native-electrode-bridge
```

Now let's use this API from our react native app. For this, we'll have to update `index.android/ios.js` code as follow:

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
       console.log(`Top movies fetched ${movies}`)
       if (movies) {
         this.setState(previousState => {
           return {dataSource: ds.cloneWithRows(movies)}
         })
       }
     }).catch(error => {
       console.log(`Error: ${error}`)
       topMovies = [{
         title: 'Titanic',
         releaseYear: 1997,
         ratings: '4.5',
         imageUrl: `https://images-na.ssl-images-amazon.com/images/M/MV5BMDdmZGU3NDQtY2E5My00ZTliLWIzOTUtMTY4ZGI1YjdiNjk3XkEyXkFqcGdeQXVyNTA4NzY1MzY@._V1_SY1000_CR0,0,671,1000_AL_.jpg`,
         description: 'Titanic'
       }, {
         title: 'Avatar',
         releaseYear: 2009,
         ratings: '4.0',
         imageUrl: `https://images-na.ssl-images-amazon.com/images/M/MV5BMTYwOTEwNjAzMl5BMl5BanBnXkFtZTcwODc5MTUwMw@@._V1_.jpg`,
         description: 'Avatar'
       }
       ]

       this.setState(previousState => {
         return {dataSource: ds.cloneWithRows(topMovies)}
       })

     })

     this.state = {
       dataSource: ds.cloneWithRows(topMovies),
     }
   }
```

You can now relaunch the MiniApp by running the command below so that it uses this updated code.

###### Android:
```bash
ern run-android
```
###### iOS:
```bash
ern run-ios
```

You will see that the UI is showing the movie names defined in the catch block. This means there was no API implementation registered to serve the `getTopRatedMovies` request.   

Let's see how we can actually write an implementation of this API.

An API implementation can either be done on the JavaScript side or the Native side.  
To make it more fun lets see how we can do this on the Native side.

### Implementing the MovieApi on Android

Open `MainApplication.java` in your favorite IDE (this file is located in `android/app/src/main/java/com/walmartlabs/ern/`), or just open the Android project (in `android/`) in Android Studio to edit this file.

Replace the whole content of this file with the following code:

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

        ElectrodeReactContainer.initialize(
                this,
                new ElectrodeReactContainer.Config().isReactNativeDeveloperSupport(RunnerConfig.RN_DEV_SUPPORT_ENABLED)
            /* Add your additional plugins configuration here */);

        MoviesApi.requests().registerGetTopRatedMoviesRequestHandler(new ElectrodeBridgeRequestHandler<None, List<Movie>>() {
            @Override
            public void onRequest(@Nullable None payload, @NonNull ElectrodeBridgeResponseListener<List<Movie>> responseListener) {
                List<Movie> movies = new ArrayList<Movie>() {{
                     add(new Movie.Builder("1", "The Shawshank Redemption").releaseYear(1994).rating(5f).imageUrl("https://images-na.ssl-images-amazon.com/images/M/MV5BMTQ1ODM2MjY3OV5BMl5BanBnXkFtZTgwMTU2MjEyMDE@._V1_.jpg").build());
                     add(new Movie.Builder("2", "The Godfather").releaseYear(1972).rating(4.9f).imageUrl("https://images-na.ssl-images-amazon.com/images/M/MV5BZTRmNjQ1ZDYtNDgzMy00OGE0LWE4N2YtNTkzNWQ5ZDhlNGJmL2ltYWdlL2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SY1000_CR0,0,704,1000_AL_.jpg").build());
                     add(new Movie.Builder("3", "The Godfather: Part II ").releaseYear(1974).rating(4f).imageUrl("https://images-na.ssl-images-amazon.com/images/M/MV5BMGM0MzkxM2MtYWQ2My00NjYyLThhYmYtMTdkNTMyNmFmYTY1XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SY1000_CR0,0,701,1000_AL_.jpg").build());
                     add(new Movie.Builder("4", "The Dark Knight").releaseYear(2008).rating(4f).imageUrl("https://images-na.ssl-images-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SY1000_CR0,0,675,1000_AL_.jpg").build());
                     add(new Movie.Builder("5", "12 Angry Men").releaseYear(1957).rating(3f).imageUrl("https://images-na.ssl-images-amazon.com/images/M/MV5BMWU4N2FjNzYtNTVkNC00NzQ0LTg0MjAtYTJlMjFhNGUxZDFmXkEyXkFqcGdeQXVyNjc1NTYyMjg@._V1_SY1000_CR0,0,649,1000_AL_.jpg").build());
                }};
                responseListener.onSuccess(movies);
            }
        });
    }

}
```

Once updated run the application directly from Android Studio, or run `ern run-android` again from your terminal, and you will see that the UI now shows the movies that are returned by your native app.

### Implementing the MovieApi on iOS

Open the generated ios project in xcode(`Location: /MovieListMiniApp/ios`) and replace the `ViewController.m` code as below

```objectivec
#import "ViewController.h"
#import "RunnerConfig.h"
#import <ElectrodeContainer/ElectrodeContainer.h>

@interface ViewController ()
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.

    MoviesAPI* moviesApi = [[MoviesAPI alloc] init];

    [moviesApi.requests registerGetTopRatedMoviesRequestHandlerWithHandler:^(id  _Nullable data, ElectrodeBridgeResponseCompletionHandler  _Nonnull block) {
        NSLog(@"Invoking request handler");
        NSMutableArray<Movie *> *movies = [[NSMutableArray alloc] init];
        [movies addObject:[self createMovie:@"1" title:@"The Shawshank Redemption" releaseYear:@1994 rating:@9.2 imageUrl:@"https://images-na.ssl-images-amazon.com/images/M/MV5BMTQ1ODM2MjY3OV5BMl5BanBnXkFtZTgwMTU2MjEyMDE@._V1_.jpg"]];
        [movies addObject:[self createMovie:@"2" title:@"The Godfather" releaseYear:@1972 rating:@9.2 imageUrl:@"https://images-na.ssl-images-amazon.com/images/M/MV5BZTRmNjQ1ZDYtNDgzMy00OGE0LWE4N2YtNTkzNWQ5ZDhlNGJmL2ltYWdlL2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SY1000_CR0,0,704,1000_AL_.jpg"]];
        [movies addObject:[self createMovie:@"3" title:@"The Godfather: Part II" releaseYear:@1974 rating:@9 imageUrl:@"https://images-na.ssl-images-amazon.com/images/M/MV5BMGM0MzkxM2MtYWQ2My00NjYyLThhYmYtMTdkNTMyNmFmYTY1XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SY1000_CR0,0,701,1000_AL_.jpg"]];
        [movies addObject:[self createMovie:@"4" title:@"The Dark Knight" releaseYear:@2008 rating:@9 imageUrl:@"https://images-na.ssl-images-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SY1000_CR0,0,675,1000_AL_.jpg"]];
        [movies addObject:[self createMovie:@"5" title:@"12 Angry Men" releaseYear:@1957 rating:@8.9 imageUrl:@"https://images-na.ssl-images-amazon.com/images/M/MV5BMWU4N2FjNzYtNTVkNC00NzQ0LTg0MjAtYTJlMjFhNGUxZDFmXkEyXkFqcGdeQXVyNjc1NTYyMjg@._V1_SY1000_CR0,0,649,1000_AL_.jpg"]];

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
    // Dispose of any resources that can be recreated.
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

/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

@end

```


## Navigating to another MiniApp to show movie details

Now let's make it more fun, add some navigation to our MiniApp !

When tapping a movie in the list, we would like to navigate to this movie details screen.
For this, we need few things:

1. A movie details screen, that we have already implemented and published to npm so that you can just reuse it. This "screen" is actually another MiniApp that we created.
2. An API that helps you navigate between these two MiniApps. We have created this API as well. If you would like to create your own API, please follow the instructions (here)[].

First let's add our very basic Navigation API to the `MovieListMiniApp` MiniApp. From the `MovieListMiniApp` directory, execute the following `ern` command, that should be used to add any dependency (native or JavaScript) to a MiniApp. We'll use it to add a dependency on the Navigation API in our `MovieListMiniApp`:

```bash
$ ern add react-native-ernnavigation-api
```

Once the API is added, we'll just make some code changes in `index.android/ios.js` file of our MiniApp.

First, add the following import statement:

```javascript
import { NavigationApi } from 'react-native-ernnavigation-api'
```

And then just replace the `render` method with the following one:

```javascript
  render () {
    return (
      <ListView style={styles.container} dataSource={this.state.dataSource}
                renderRow={(movie) =>
                <TouchableHighlight onPress={() => this._onPressRow(movie)} underlayColor="grey">
                  <View style={styles.row} onPress={() => this._onPressRow(movie)}>
                    <Image
                      style={styles.icon}
                      source={{
                        uri: movie.imageUrl ? movie.imageUrl : 'http://image10.bizrate-images.com/resize?sq=60&uid=2216744464?odnHeight=100&odnWidth=100&odnBg=FFFFFF'
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

  _onPressRow (movie) {
    movie.isSelect = !movie.isSelect
    NavigationApi.requests().navigate('MovieDetailsMiniApp', {'initialPayload': JSON.stringify(movie)}).catch(() => {
      console.log("Navigation failed.");
    })
  }
  ```

Now whenever you click on a movie in the list, it will invoke the navigation API to navigate to MovieDetails app.

Let's do that magic now.

###### Android:

```
$ ern run-android --miniapps MovieDetailsMiniApp --mainMiniAppName MovieListMiniApp
```

###### iOS:

```
$ ern run-ios --miniapps MovieDetailsMiniApp --mainMiniAppName MovieListMiniApp
```
The above command now includes the `MovieDetailsMiniApp` inside the generated contianer. This is how easy it is to combine multiple MiniApps. Just by running an `ern` command.

### Implementing the NavigationApi on Android

Now, let's open Android Studio, perform a project sync to ensure that the new container.aar is refreshed so that we can add an implementation for the navigation API.

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
                        Log.d("NAVIGATION", "" + navigateData.getminiAppName());
                        Log.d("NAVIGATION", "" + navigateData.getinitialPayload());

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
                        Log.d("NAVIGATION", "Not enough data provided to navigate");
                    }
                }
            }
        });
    }
}

```

Launch the app again from Android Studio, and click on a movie in the list. You will see that the movie details page is now displaying the details of the movie that you clicked.

### Implementing the NavigationApi on iOS

Now, let's open the project in Xcode

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

Now run the project from Xcode and you shall see the magic.



There you go. Now that you have successfully used `Electrode React Native` platform to build your first app and integrate multiple apps to it, it's time for you go and challenge yourself to build more fun stuffs with it.
