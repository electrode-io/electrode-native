package com.ernmvoie.ern.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeHolder;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import com.walmartlabs.electrode.reactnative.bridge.RequestHandlerProcessor;
import com.walmartlabs.electrode.reactnative.bridge.RequestProcessor;
import java.util.*;
import com.ernmvoie.ern.model.Movie;


final class MoviesRequests implements MoviesApi.Requests {
    MoviesRequests() {}


    @Override
    public void registerGetMovieDetailRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, Object> handler) {
        new RequestHandlerProcessor<>(REQUEST_GET_MOVIE_DETAIL, String.class, Object.class, handler).execute();
    }

    @Override
    public void registerGetTopRatedMoviesRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, List<Movie>> handler) {
        new RequestHandlerProcessor<>(REQUEST_GET_TOP_RATED_MOVIES, None.class, (Class) Movie.class, handler).execute();
    }

    //------------------------------------------------------------------------------------------------------------------------------------

    @Override
    public void getMovieDetail(String movieId,@NonNull final ElectrodeBridgeResponseListener<Object> responseListener) {
        new RequestProcessor<>(REQUEST_GET_MOVIE_DETAIL,  movieId, Object.class, responseListener).execute();
    }
    @Override
    public void getTopRatedMovies(@NonNull final ElectrodeBridgeResponseListener<List<Movie>> responseListener) {
        new RequestProcessor<>(REQUEST_GET_TOP_RATED_MOVIES, null, (Class) List.class, Movie.class, responseListener).execute();
    }
}