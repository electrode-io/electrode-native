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

public class Person implements Parcelable, Bridgeable {

    private String name;
    private BirthYear birthYear;
    private String gender;
    private Boolean isAlive;

    private Person() {}

    private Person(Builder builder) {
        this.name = builder.name;
        this.birthYear = builder.birthYear;
        this.gender = builder.gender;
        this.isAlive = builder.isAlive;
    }

    private Person(Parcel in) {
        this(in.readBundle());
    }

    public Person(@NonNull Bundle bundle) {
        if(!bundle.containsKey("name")){
            throw new IllegalArgumentException("name property is required");
        }

        if(!bundle.containsKey("gender")){
            throw new IllegalArgumentException("gender property is required");
        }

        this.name = bundle.getString("name");
        this.birthYear = bundle.containsKey("birthYear") ? new BirthYear(bundle.getBundle("birthYear")) : null;
        this.gender = bundle.getString("gender");
        this.isAlive = bundle.containsKey("isAlive") ? bundle.getBoolean("isAlive") : null;
    }

    public static final Creator<Person> CREATOR = new Creator<Person>() {
        @Override
        public Person createFromParcel(Parcel in) {
            return new Person(in);
        }

        @Override
        public Person[] newArray(int size) {
            return new Person[size];
        }
    };

    /**
    * Persons name
    *
    * @return String
    */
    @NonNull
    public String getName() {
        return name;
    }

    /**
    * Persons birth year
    *
    * @return BirthYear
    */
    @Nullable
    public BirthYear getBirthYear() {
        return birthYear;
    }

    @NonNull
    public String getGender() {
        return gender;
    }

    @Nullable
    public Boolean getIsAlive() {
        return isAlive;
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
        bundle.putString("name", this.name);
        bundle.putString("gender", this.gender);
        if(this.birthYear != null) {
            bundle.putBundle("birthYear", this.birthYear.toBundle());
        }
        if(this.isAlive != null) {
            bundle.putBoolean("isAlive", this.isAlive);
        }
        return bundle;
    }

    @Override
    public String toString() {
        return "{"
        + "name:" + (name != null ? "\"" + name + "\"" : null)+ ","
        + "birthYear:" + (birthYear != null ? birthYear.toString() : null)+ ","
        + "gender:" + (gender != null ? "\"" + gender + "\"" : null)+ ","
        + "isAlive:" + isAlive
        + "}";
    }

    public static class Builder {
        private final String name;
        private final String gender;
        private BirthYear birthYear;
        private Boolean isAlive;

        public Builder(@NonNull String name, @NonNull String gender) {
            this.name = name;
            this.gender = gender;
        }

        @NonNull
        public Builder birthYear(@Nullable BirthYear birthYear) {
            this.birthYear = birthYear;
            return this;
        }
        @NonNull
        public Builder isAlive(@Nullable Boolean isAlive) {
            this.isAlive = isAlive;
            return this;
        }

        @NonNull
        public Person build() {
            return new Person(this);
        }
    }
}
