/*
* Copyright 2017 WalmartLabs
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* http://www.apache.org/licenses/LICENSE-2.0
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

package com.ernmovie.ern.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEventListener;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEvent;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import java.util.*;
import java.util.UUID;

import com.ernmovie.ern.model.Movie;

public final class MoviesApi {
    private static final Requests REQUESTS;

    static {
        REQUESTS = new MoviesRequests();
    }

    private MoviesApi() {
    }

    @NonNull
    public static Requests requests() {
        return REQUESTS;
    }



    public interface Requests {
        String REQUEST_GET_MOVIE_DETAIL = "com.ernmovie.ern.api.request.getMovieDetail";
        String REQUEST_GET_TOP_RATED_MOVIES = "com.ernmovie.ern.api.request.getTopRatedMovies";


        void registerGetMovieDetailRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, Object> handler);

        void registerGetTopRatedMoviesRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, List<Movie>> handler);

        void getMovieDetail(String movieId, @NonNull final ElectrodeBridgeResponseListener<Object> responseListener);

        void getTopRatedMovies(@NonNull final ElectrodeBridgeResponseListener<List<Movie>> responseListener);

    }
}