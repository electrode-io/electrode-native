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

package com.ernmovie.ern.model;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import java.util.List;

import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.*;

public class Movie implements Parcelable, Bridgeable {

    private String id;
    private String title;
    private Integer releaseYear;
    private String imageUrl;
    private Float rating;
    private Synopsis synopsis;

    private Movie() {}

    private Movie(Builder builder) {
        this.id = builder.id;
        this.title = builder.title;
        this.releaseYear = builder.releaseYear;
        this.imageUrl = builder.imageUrl;
        this.rating = builder.rating;
        this.synopsis = builder.synopsis;
    }

    private Movie(Parcel in) {
        this(in.readBundle());
    }

    public Movie(@NonNull Bundle bundle) {
        if(!bundle.containsKey("id")){
            throw new IllegalArgumentException("id property is required");
        }

        if(!bundle.containsKey("title")){
            throw new IllegalArgumentException("title property is required");
        }

        this.id = bundle.getString("id");
        this.title = bundle.getString("title");
        this.releaseYear = getNumberValue(bundle, "releaseYear") == null ? null : getNumberValue(bundle, "releaseYear").intValue();
        this.imageUrl = bundle.getString("imageUrl");
        this.rating = getNumberValue(bundle, "rating") == null ? null : getNumberValue(bundle, "rating").floatValue();
        this.synopsis = bundle.containsKey("synopsis") ? new Synopsis(bundle.getBundle("synopsis")) : null;
    }

    public static final Creator<Movie> CREATOR = new Creator<Movie>() {
        @Override
        public Movie createFromParcel(Parcel in) {
            return new Movie(in);
        }

        @Override
        public Movie[] newArray(int size) {
            return new Movie[size];
        }
    };

    /**
    * uniqueId
    *
    * @return String
    */
    @NonNull
    public String getId() {
        return id;
    }

    /**
    * Movie name
    *
    * @return String
    */
    @NonNull
    public String getTitle() {
        return title;
    }

    /**
    * Movie released year
    *
    * @return Integer
    */
    @Nullable
    public Integer getReleaseYear() {
        return releaseYear;
    }

    /**
    * URL for the movie banner
    *
    * @return String
    */
    @Nullable
    public String getImageUrl() {
        return imageUrl;
    }

    /**
    * Movie rating 1-10, -1 for no rating
    *
    * @return Float
    */
    @Nullable
    public Float getRating() {
        return rating;
    }

    @Nullable
    public Synopsis getSynopsis() {
        return synopsis;
    }


    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeBundle(toBundle());
    }

    @NonNull
    @Override
    public Bundle toBundle() {
        Bundle bundle = new Bundle();
        bundle.putString("id", this.id);
        bundle.putString("title", this.title);
        if(this.releaseYear != null) {
            bundle.putInt("releaseYear", this.releaseYear);
        }
        if(imageUrl != null) {
            bundle.putString("imageUrl", this.imageUrl );
        }
        if(this.rating != null) {
           bundle.putFloat("rating", this.rating);
        }
        if(this.synopsis != null) {
            bundle.putBundle("synopsis", this.synopsis.toBundle());
        }
        return bundle;
    }

    @Override
    public String toString() {
        return "{"
        + "id:" + (id != null ? "\"" + id + "\"" : null)+ ","
        + "title:" + (title != null ? "\"" + title + "\"" : null)+ ","
        + "releaseYear:" + releaseYear+ ","
        + "imageUrl:" + (imageUrl != null ? "\"" + imageUrl + "\"" : null)+ ","
        + "rating:" + rating+ ","
        + "synopsis:" + (synopsis != null ? synopsis.toString() : null)
        + "}";
    }

    public static class Builder {
        private final String id;
        private final String title;
        private Integer releaseYear;
        private String imageUrl;
        private Float rating;
        private Synopsis synopsis;

        public Builder(@NonNull String id, @NonNull String title) {
            this.id = id;
            this.title = title;
        }

        @NonNull
        public Builder releaseYear(@Nullable Integer releaseYear) {
            this.releaseYear = releaseYear;
            return this;
        }
        @NonNull
        public Builder imageUrl(@Nullable String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }
        @NonNull
        public Builder rating(@Nullable Float rating) {
            this.rating = rating;
            return this;
        }
        @NonNull
        public Builder synopsis(@Nullable Synopsis synopsis) {
            this.synopsis = synopsis;
            return this;
        }

        @NonNull
        public Movie build() {
            return new Movie(this);
        }
    }
}
