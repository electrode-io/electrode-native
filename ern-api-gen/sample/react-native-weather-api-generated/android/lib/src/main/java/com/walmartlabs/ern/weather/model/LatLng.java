package com.walmartlabs.ern.weather.model;

    import android.os.Bundle;

    public class LatLng {
      private float lat;
      private float lng;

      public LatLng(float lat, float lng) {
        this.lat = lat;
        this.lng = lng;
      }

      public float getLat() {
        return this.lat;
      }

      public float getLng() {
        return this.lng;
      }

      public static LatLng fromBundle(Bundle bundle) {
        return new LatLng(bundle.getFloat("lat"), bundle.getFloat("lng"));
      }

      public Bundle toBundle() {
        Bundle result = new Bundle();
        result.putFloat("lat", this.lat);
        result.putFloat("lng", this.lng);
        return result;
      }
    }