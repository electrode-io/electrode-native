package com.walmartlabs.ern.model;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;

import static com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments.getNumberValue;

public class User implements Parcelable, Bridgeable {

    private Long id;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phone;
    private Integer userStatus;

    private User() {}

    private User(Builder builder) {
        this.id = builder.id;
        this.username = builder.username;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.email = builder.email;
        this.password = builder.password;
        this.phone = builder.phone;
        this.userStatus = builder.userStatus;
    }

    private User(Parcel in) {
        this(in.readBundle());
    }

    public User(@NonNull Bundle bundle) {
        this.username = bundle.getString("username");
        this.firstName = bundle.getString("firstName");
        this.lastName = bundle.getString("lastName");
        this.email = bundle.getString("email");
        this.password = bundle.getString("password");
        this.phone = bundle.getString("phone");
        this.userStatus = getNumberValue(bundle, "userStatus") == null ? null : getNumberValue(bundle, "userStatus").intValue();
    }

    public static final Creator<User> CREATOR = new Creator<User>() {
        @Override
        public User createFromParcel(Parcel in) {
            return new User(in);
        }

        @Override
        public User[] newArray(int size) {
            return new User[size];
        }
    };

    @Nullable
    public Long getId() {
        return id;
    }

    @Nullable
    public String getUsername() {
        return username;
    }

    @Nullable
    public String getFirstName() {
        return firstName;
    }

    @Nullable
    public String getLastName() {
        return lastName;
    }

    @Nullable
    public String getEmail() {
        return email;
    }

    @Nullable
    public String getPassword() {
        return password;
    }

    @Nullable
    public String getPhone() {
        return phone;
    }

    /**
    * User Status
    *
    * @return Integer
    */
    @Nullable
    public Integer getUserStatus() {
        return userStatus;
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
        if(username != null) {
            this.username = bundle.getString("username");
        }
        if(firstName != null) {
            this.firstName = bundle.getString("firstName");
        }
        if(lastName != null) {
            this.lastName = bundle.getString("lastName");
        }
        if(email != null) {
            this.email = bundle.getString("email");
        }
        if(password != null) {
            this.password = bundle.getString("password");
        }
        if(phone != null) {
            this.phone = bundle.getString("phone");
        }
        if(userStatus != null) {
            this.userStatus = getNumberValue(bundle, "userStatus") == null ? null : getNumberValue(bundle, "userStatus").intValue();
        }
        return bundle;
    }

    public static class Builder {
        private Long id;
        private String username;
        private String firstName;
        private String lastName;
        private String email;
        private String password;
        private String phone;
        private Integer userStatus;

        public Builder() {
        }

        @NonNull
        public Builder id(@Nullable Long id) {
            this.id = id;
            return this;
        }
        @NonNull
        public Builder username(@Nullable String username) {
            this.username = username;
            return this;
        }
        @NonNull
        public Builder firstName(@Nullable String firstName) {
            this.firstName = firstName;
            return this;
        }
        @NonNull
        public Builder lastName(@Nullable String lastName) {
            this.lastName = lastName;
            return this;
        }
        @NonNull
        public Builder email(@Nullable String email) {
            this.email = email;
            return this;
        }
        @NonNull
        public Builder password(@Nullable String password) {
            this.password = password;
            return this;
        }
        @NonNull
        public Builder phone(@Nullable String phone) {
            this.phone = phone;
            return this;
        }
        @NonNull
        public Builder userStatus(@Nullable Integer userStatus) {
            this.userStatus = userStatus;
            return this;
        }

        @NonNull
        public User build() {
            return new User(this);
        }
    }
}
