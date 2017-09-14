# Getting started

This guide will walk you through steps to build react native apps using ern platform and other features that the platform offers.

For the purpose of the tutorial, we are going to create a Movie application that lists top rated movies and clicking on any movie will take the user to the details page. Let's break this down into two miniapps.

1. MovieListApp: To list the top movies.
2. MovieDetailsApp: Show the details of a movie. 

This will help us understand how easy it is to integrate multiple react native applications into a native application. Let's get started.


Before we start, we assume that you have already completed the electrode react native platform setup. If not please follow the instructions [here](https://gecgithub01.walmart.com/Electrode-Mobile-Platform/ern-platform/wiki/Getting-started) before proceeding with the getting started guide.

* Your first Miniapp
Lets first create a MiniApp( nothing but a react native app) using ern platform. Now would be a good time to create a workspace folder for keeping all the projects that we are going to create using the platform.

```
cd <your-workspace>
$ ern create-miniapp MovieListApp
```
You will see a new folder created in your workspace. Now let's try to run it and see how it looks on an android or ios device. The assumption is that you have already setup android or ios emulator/simulator, if not please proceed [here]() to complete the setup.

```
$ cd MovieListApp
Android:
$ ern run-android

iOS:
$ ern run-ios
```
Please pick one emulator or device when prompted. At the end, you will see that your first miniapp is launched. AS we stated before, a miniapp is nothing but a react native app, so you will see your first react native app.!

Now let's make it an app that lists top movies. Open the project in your favorite JS editor and copy and paste the below code inside `index.android.js` and `index.ios.js`.

Use vi or any editor of your choice
```
$ vi index.android.js
$ vi index.ios.js
```
Copy and paste below code
```
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ListView,
  TouchableHighlight,
  Image
} from 'react-native';

export default class MovieListApp extends Component {

  constructor() {
    super();
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      dataSource: ds.cloneWithRows([{
        title: "Fast and Furious 1",
        release: 2010,
        ratings: "4.5",
        description: "This is the first movie ever released"
      }, {
        title: "Fast and Furious 2",
        release: 2011,
        ratings: "4.0",
        description: "This is the second movie ever released"
      }
      ]),
    };
  }

render() {
   return (
     <ListView style = {styles.container} dataSource={this.state.dataSource}
       renderRow={(rowData) =>
         <TouchableHighlight underlayColor = "grey">
           <View>
             <View style = {styles.rowtop}>
               <Text style = {styles.title}>{rowData.title}</Text>
               <Text style = {styles.rating}>{rowData.rating}</Text>
             </View>
             <Image
               style = {styles.icon}
               source = {{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
             />
             <View >
               <Text style = {styles.subtitle}>{rowData.title}</Text>
             </View>

           </View>
         </TouchableHighlight>
     }
     renderSeparator={(sectionId, rowId)=> <View key={rowId} style={styles.separator}/>}
     />
   );
 }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
  rowtop: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor:'blue',
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
    backgroundColor:'red',
  },
  ratings: {
    fontSize: 15,
    backgroundColor:'yellow',

  },
  subtitle: {
    marginLeft: 12,
    marginRight: 12,
    flex:1,
    fontSize: 12
  },
  separator: {
    padding: 1,
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#8E8E8E',
  },
  icon: {
    justifyContent: 'center',
    flex: 1,
    height: 50,
    width: 50
  }
});

AppRegistry.registerComponent('MovieListApp', () => MovieListApp);

```

. Go and reload the UI

```
Android: CMD+M --> Reload
IOS: CMD+M
```

You can now see a new UI. Now let's add an API so that we can fetch some movie names provided by the native app instead of hard coding them inside `index.android/ios.js`

. Add movie API to MovieListApp

```
$ cd ../MovieListApp
$ ern add react-native-ernmovie-api
$ ern add react-native-electrode-bridge
```

Now let's invoke this API from our react native app. Let's update `index.android/ios.js` code.

```
import {MoviesApi} from "react-native-ernmovie-api"
.
.
.
 constructor() {
    super();
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

    let topMovies = []
    MoviesApi.requests().getTopRatedMovies().then((movies) => {
      console.log(`Top movies fetcehd ${movies}`);
      if(movies) {
        this.setState(previousState => {
          return {dataSource: ds.cloneWithRows(movies)}
        })
      }
    }).catch(error => {
       console.log(`Error: ${error}`);
       topMovies = [{
         title: "Default - FF1",
         release: 2010,
         ratings: "4.5",
         description: "This is the first movie ever released"
       }, {
         title: "Default - FF2",
         release: 2011,
         ratings: "4.0",
         description: "This is the second movie ever released"
       }
     ];

     this.setState(previousState => {
       return {dataSource: ds.cloneWithRows(topMovies)}
     })

    })

    this.state = {
      dataSource: ds.cloneWithRows(topMovies),
    };
  }

```

When you reload the API, you can see that the UI is showing the movie names that was returned inside the catch block, which means there was no implementation available to show the top movies. Now let's see how we can write an implementation of this API.

This can be done in two ways, either on JS side or Native side. To make it more fun lets see how we can do this on the native side.

#### Android:
Open the generated android project in android studio(`Location: /MovieListApp/android`) and replace the `MainApplication.java` code as below

```
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
                    add(new Movie.Builder("1", "The Shawshank Redemption").releaseYear(1994).rating(9.2f).build());
                    add(new Movie.Builder("2", "The Godfather").releaseYear(1972).rating(9.2f).build());
                    add(new Movie.Builder("3", "The Godfather: Part II ").releaseYear(1974).rating(9.0f).build());
                    add(new Movie.Builder("4", "The Dark Knight").releaseYear(2008).rating(9.0f).build());
                    add(new Movie.Builder("5", "12 Angry Men").releaseYear(1957).rating(8.9f).build());
                }};
                responseListener.onSuccess(movies);
            }
        });
    }

}

```

Once updated run the app from Android studio and you can see that UI now shows the movies that are returned by your native app.

Now let's make it more fun, add some click actions to our app!.

When a user clicks on a movie it should take you to the details page. For this, we need few things,

1. A movie details page, which we have developed and published for you already and we are going to reuse it. This is nothing but another miniapp that we created.
2. An API that helps you navigate between these apps, we have created this API as well. If you would like to create your own API, please follow the instructions (here)[].

Now let's add the navigation API to MovieListApp.

```
$ cd MovieListApp
$ ern add react-native-navigation-api
```

Once the api is added, let's make some code changes in `index.android/ios.js` file.

```
import { NavigationApi } from 'react-native-navigation-api'
.
.
.
.
render () {
    return (
      <ListView style={styles.container} dataSource={this.state.dataSource}
                renderRow={(rowData) =>
                  <TouchableHighlight onPress={() => this._onPressRow(rowData)} underlayColor="grey">
                    <View>
                      <View style={styles.rowtop}>
                        <Text style={styles.title}>{rowData.title}</Text>
                        <Text style={styles.rating}>{rowData.rating}</Text>
                      </View>
                      <Image
                        style={styles.icon}
                        source={{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
                      />
                      <View >
                        <Text style={styles.subtitle}>{rowData.title}</Text>
                      </View>

                    </View>
                  </TouchableHighlight>
                }
                renderSeparator={(sectionId, rowId) => <View key={rowId} style={styles.separator}/>}
      />
    )
  }

  _onPressRow (rowData) {
    rowData.isSelect = !rowData.isSelect
    console.log('----------')
    console.log(rowData)
    NavigationApi.requests().navigate('MovieDetailsApp', {'initialPayload': JSON.stringify(rowData)}, 5000)
  }
```

So with this implementation when you click on a  movie item it invokes the navigation API and asks to navigate to MovieDetails app.

Let's do that magic now.

```
$cd MovieListApp
$ern run-android --miniapps MovieDetailsApp --mainMiniAppName MovieListApp
```
The above command now includes the MovieDetailsApp inside the generated contianer. This is how easy it is to combine multiple miniapps. Just by running a command.

Now, let's open Android Studio, perform a project sync to ensure that the new container.aar is refreshed so that we can add an implementation for the navigation API.

Add the following inside `onCreate` of the `MainActivity.java`

```
package com.walmartlabs.ern;

import android.content.Intent;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import com.navigation.ern.api.NavigateData;
import com.navigation.ern.api.NavigationApi;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.ern.container.ElectrodeMiniAppActivity;
import com.walmartlabs.ern.container.miniapps.MiniAppsConfig;
.
.
.
 @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        getIntent().getBundleExtra("data");

        Intent i = new Intent(this, MovieListAppActivity.class);
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
```

Launch the app again from android and click on a movie and you will see that the movie details page is now displaying the details of the movie that you clicked.

There you go. Now that you have successfully used `Electrode react native` platform to build your first app and integrate multiple apps to it, it's time for you go and challenge yourself to build more fun stuffs with it.
