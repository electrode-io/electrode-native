package com.facebook.react.bridge;

import android.app.Activity;
import android.content.Intent;
import android.support.annotation.NonNull;

import java.lang.ref.WeakReference;

/**
 * Ensures we have an activity context to start new activities.
 * When transitioning between activities, React Native will reset current activity to null at
 * Activity#onPause and set the current activity at Activity#onResume. Thus between the Activity#onPause
 * of one activity and the Activity#onResume of the other, RN doesn't have a activity context reference,
 * and without that is not possible to start a new activity on the same task.  That happens for instance
 * at Checkout. We start the Checkout Activity right after getting the result from Login Activity.
 * Activity#onActivityResult is called before Activity#onResume, thus we don't have an activity context.
 * Best solution without changes to RN is to wait until we have an activity context.
 */
//FIXME: UGLY HACK
public final class SafeActivityStarter {

    private final WeakReference<ReactContext> mReactContextRef;
    private final Intent mIntent;

    public SafeActivityStarter(@NonNull ReactContext reactContext, @NonNull Intent intent) {
        mReactContextRef = new WeakReference<>(reactContext);
        mIntent = intent;
    }

    public void startActivity() {
        ReactContext reactContext = mReactContextRef.get();
        if (reactContext != null) {
            Activity activity = reactContext.getCurrentActivity();

            if (activity != null) {
                activity.startActivity(mIntent);
            } else {
                reactContext.addLifecycleEventListener(new LifecycleEventListener() {
                    @Override
                    public void onHostResume() {
                        final ReactContext reactContext = mReactContextRef.get();
                        if (reactContext != null) {
                            Activity activity = reactContext.getCurrentActivity();
                            if (activity != null) {
                                activity.startActivity(mIntent);
                                reactContext.removeLifecycleEventListener(this);
                            }
                        }
                    }

                    @Override
                    public void onHostPause() {

                    }

                    @Override
                    public void onHostDestroy() {

                    }
                });
            }

        }

    }
}
