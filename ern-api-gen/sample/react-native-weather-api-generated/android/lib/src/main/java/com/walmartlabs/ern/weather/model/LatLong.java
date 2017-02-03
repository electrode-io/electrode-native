package com.walmartlabs.ern.weather.model;

import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

public class LatLong implements Parcelable {

    private static final String KEY_BUNDLE_LATLONG = "latLong";

    @Nullable
    public static LatLong fromBundle(@Nullable Bundle bundle) {
        if (bundle == null) {
            return null;
        }

        Parcelable parcelable = bundle.getParcelable(KEY_BUNDLE_LATLONG);
        if (parcelable instanceof LatLong) {
            return (LatLong) parcelable;
        } else {
            return null;
        }
    }

    private final Integer lat;
    private final Integer long;

    private LatLong(Builder builder) {
        this.lat = builder.lat;
        this.long = builder.long;
    }

    private LatLong(Parcel in) {
        lat = in.readInt();
        long = in.readInt();
    }

    public static final Creator<LatLong> CREATOR = new Creator<LatLong>() {
        @Override
        public LatLong createFromParcel(Parcel in) {
            return new LatLong(in);
        }

        @Override
        public LatLong[] newArray(int size) {
            return new LatLong[size];
        }
    };

    @NonNull
    public Integer getLat() {
        return lat;
    }

    @NonNull
    public Integer getLong() {
        return long;
    }


    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeInt(lat);
        dest.writeInt(long);
    }

    @NonNull
    public Bundle toBundle() {
        Bundle bundle = new Bundle();
        bundle.putParcelable(KEY_BUNDLE_LATLONG, this);
        return bundle;
    }

    public static class Builder {
        private final Integer lat;
        private final Integer long;

        public Builder(@NonNull Integer lat, @NonNull Integer long) {
            this.lat = lat;
            this.long = long;
        }

        @NonNull
        public LatLong build() {
            return new LatLong(this);
        }
    }
}
