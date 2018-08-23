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

public class Synopsis implements Parcelable, Bridgeable {

    private Person director;
    private List<Person> cast;
    private String language;
    private String country;
    private String rating;
    private Integer runtime;
    private String releaseDate;

    private Synopsis() {}

    private Synopsis(Builder builder) {
        this.director = builder.director;
        this.cast = builder.cast;
        this.language = builder.language;
        this.country = builder.country;
        this.rating = builder.rating;
        this.runtime = builder.runtime;
        this.releaseDate = builder.releaseDate;
    }

    private Synopsis(Parcel in) {
        this(in.readBundle());
    }

    public Synopsis(@NonNull Bundle bundle) {
        this.director = bundle.containsKey("director") ? new Person(bundle.getBundle("director")) : null;
        this.cast = bundle.containsKey("cast") ? getList(bundle.getParcelableArray("cast"), Person.class) : null;
        this.language = bundle.getString("language");
        this.country = bundle.getString("country");
        this.rating = bundle.getString("rating");
        this.runtime = getNumberValue(bundle, "runtime") == null ? null : getNumberValue(bundle, "runtime").intValue();
        this.releaseDate = bundle.getString("releaseDate");
    }

    public static final Creator<Synopsis> CREATOR = new Creator<Synopsis>() {
        @Override
        public Synopsis createFromParcel(Parcel in) {
            return new Synopsis(in);
        }

        @Override
        public Synopsis[] newArray(int size) {
            return new Synopsis[size];
        }
    };

    @Nullable
    public Person getDirector() {
        return director;
    }

    @Nullable
    public List<Person> getCast() {
        return cast;
    }

    @Nullable
    public String getLanguage() {
        return language;
    }

    @Nullable
    public String getCountry() {
        return country;
    }

    @Nullable
    public String getRating() {
        return rating;
    }

    /**
    * Runtime in minutes
    *
    * @return Integer
    */
    @Nullable
    public Integer getRuntime() {
        return runtime;
    }

    @Nullable
    public String getReleaseDate() {
        return releaseDate;
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
        if(this.director != null) {
            bundle.putBundle("director", this.director.toBundle());
        }
        if(this.cast != null) {
            updateBundleWithList(this.cast, bundle, "cast");
        }
        if(language != null) {
            bundle.putString("language", this.language );
        }
        if(country != null) {
            bundle.putString("country", this.country );
        }
        if(rating != null) {
            bundle.putString("rating", this.rating );
        }
        if(this.runtime != null) {
            bundle.putInt("runtime", this.runtime);
        }
        if(releaseDate != null) {
            bundle.putString("releaseDate", this.releaseDate );
        }
        return bundle;
    }

    @Override
    public String toString() {
        return "{"
        + "director:" + (director != null ? director.toString() : null)+ ","
        + "cast:" + (cast != null ? cast.toString() : null)+ ","
        + "language:" + (language != null ? "\"" + language + "\"" : null)+ ","
        + "country:" + (country != null ? "\"" + country + "\"" : null)+ ","
        + "rating:" + (rating != null ? "\"" + rating + "\"" : null)+ ","
        + "runtime:" + runtime+ ","
        + "releaseDate:" + (releaseDate != null ? "\"" + releaseDate + "\"" : null)
        + "}";
    }

    public static class Builder {
        private Person director;
        private List<Person> cast;
        private String language;
        private String country;
        private String rating;
        private Integer runtime;
        private String releaseDate;

        public Builder() {
        }

        @NonNull
        public Builder director(@Nullable Person director) {
            this.director = director;
            return this;
        }
        @NonNull
        public Builder cast(@Nullable List<Person> cast) {
            this.cast = cast;
            return this;
        }
        @NonNull
        public Builder language(@Nullable String language) {
            this.language = language;
            return this;
        }
        @NonNull
        public Builder country(@Nullable String country) {
            this.country = country;
            return this;
        }
        @NonNull
        public Builder rating(@Nullable String rating) {
            this.rating = rating;
            return this;
        }
        @NonNull
        public Builder runtime(@Nullable Integer runtime) {
            this.runtime = runtime;
            return this;
        }
        @NonNull
        public Builder releaseDate(@Nullable String releaseDate) {
            this.releaseDate = releaseDate;
            return this;
        }

        @NonNull
        public Synopsis build() {
            return new Synopsis(this);
        }
    }
}
