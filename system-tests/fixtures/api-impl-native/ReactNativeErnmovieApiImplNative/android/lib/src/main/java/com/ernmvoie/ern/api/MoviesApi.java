package com.ernmvoie.ern.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEventListener;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import java.util.*;
import com.ernmvoie.ern.model.Movie;

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
        String REQUEST_GET_MOVIE_DETAIL = "com.ernmvoie.ern.api.request.getMovieDetail";
        String REQUEST_GET_TOP_RATED_MOVIES = "com.ernmvoie.ern.api.request.getTopRatedMovies";


        void registerGetMovieDetailRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, Object> handler);

        void registerGetTopRatedMoviesRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, List<Movie>> handler);

        void getMovieDetail(String movieId, @NonNull final ElectrodeBridgeResponseListener<Object> responseListener);

        void getTopRatedMovies(@NonNull final ElectrodeBridgeResponseListener<List<Movie>> responseListener);

    }
}