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

package com.facebook.react.bridge;

import android.app.Activity;
import android.content.Intent;
import androidx.annotation.NonNull;

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
