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

public class BirthYear implements Parcelable, Bridgeable {

    private Integer month;
    private Integer year;
    private Integer date;
    private String place;

    private BirthYear() {}

    private BirthYear(Builder builder) {
        this.month = builder.month;
        this.year = builder.year;
        this.date = builder.date;
        this.place = builder.place;
    }

    private BirthYear(Parcel in) {
        this(in.readBundle());
    }

    public BirthYear(@NonNull Bundle bundle) {
        this.month = getNumberValue(bundle, "month") == null ? null : getNumberValue(bundle, "month").intValue();
        this.year = getNumberValue(bundle, "year") == null ? null : getNumberValue(bundle, "year").intValue();
        this.date = getNumberValue(bundle, "date") == null ? null : getNumberValue(bundle, "date").intValue();
        this.place = bundle.getString("place");
    }

    public static final Creator<BirthYear> CREATOR = new Creator<BirthYear>() {
        @Override
        public BirthYear createFromParcel(Parcel in) {
            return new BirthYear(in);
        }

        @Override
        public BirthYear[] newArray(int size) {
            return new BirthYear[size];
        }
    };

    /**
    * Birth month
    *
    * @return Integer
    */
    @Nullable
    public Integer getMonth() {
        return month;
    }

    /**
    * Birth year
    *
    * @return Integer
    */
    @Nullable
    public Integer getYear() {
        return year;
    }

    /**
    * Birth date
    *
    * @return Integer
    */
    @Nullable
    public Integer getDate() {
        return date;
    }

    /**
    * Birth place
    *
    * @return String
    */
    @Nullable
    public String getPlace() {
        return place;
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
        if(this.month != null) {
            bundle.putInt("month", this.month);
        }
        if(this.year != null) {
            bundle.putInt("year", this.year);
        }
        if(this.date != null) {
            bundle.putInt("date", this.date);
        }
        if(place != null) {
            bundle.putString("place", this.place );
        }
        return bundle;
    }

    @Override
    public String toString() {
        return "{"
        + "month:" + month+ ","
        + "year:" + year+ ","
        + "date:" + date+ ","
        + "place:" + (place != null ? "\"" + place + "\"" : null)
        + "}";
    }

    public static class Builder {
        private Integer month;
        private Integer year;
        private Integer date;
        private String place;

        public Builder() {
        }

        @NonNull
        public Builder month(@Nullable Integer month) {
            this.month = month;
            return this;
        }
        @NonNull
        public Builder year(@Nullable Integer year) {
            this.year = year;
            return this;
        }
        @NonNull
        public Builder date(@Nullable Integer date) {
            this.date = date;
            return this;
        }
        @NonNull
        public Builder place(@Nullable String place) {
            this.place = place;
            return this;
        }

        @NonNull
        public BirthYear build() {
            return new BirthYear(this);
        }
    }
}
