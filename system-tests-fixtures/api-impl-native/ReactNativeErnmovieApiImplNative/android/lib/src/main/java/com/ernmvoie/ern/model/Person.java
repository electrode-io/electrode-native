package com.ernmvoie.ern.model;

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
