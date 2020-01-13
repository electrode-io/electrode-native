/*
 * Copyright 2017 WalmartLabs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.walmartlabs.electrode.reactnative.bridge.helpers;

import android.os.Bundle;
import android.support.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.walmartlabs.electrode.reactnative.bridge.BridgeMessage;

import javax.annotation.Nullable;

// Contains methods to work with arrays that are not supported out of the box by react-native
// Arguments class
public class ArgumentsEx {

    public static double[] toDoubleArray(@NonNull ReadableArray readableArray) {
        int arraySize = readableArray.size();
        double[] result = new double[arraySize];
        for (int i = 0; i < arraySize; i++) {
            result[i] = readableArray.getDouble(i);
        }
        return result;
    }

    public static int[] toIntArray(@NonNull ReadableArray readableArray) {
        int arraySize = readableArray.size();
        int[] result = new int[arraySize];
        for (int i = 0; i < arraySize; i++) {
            result[i] = readableArray.getInt(i);
        }
        return result;
    }

    public static String[] toStringArray(@NonNull ReadableArray readableArray) {
        int arraySize = readableArray.size();
        String[] result = new String[arraySize];
        for (int i = 0; i < arraySize; i++) {
            result[i] = readableArray.getString(i);
        }
        return result;
    }

    public static boolean[] toBooleanArray(@NonNull ReadableArray readableArray) {
        int arraySize = readableArray.size();
        boolean[] result = new boolean[arraySize];
        for (int i = 0; i < arraySize; i++) {
            result[i] = readableArray.getBoolean(i);
        }
        return result;
    }

    public static Bundle[] toBundleArray(@NonNull ReadableArray readableArray) {
        int arraySize = readableArray.size();
        Bundle[] result = new Bundle[arraySize];
        for (int i = 0; i < arraySize; i++) {
            result[i] = Arguments.toBundle(readableArray.getMap(i));
        }
        return result;
    }

    public static Object toObjectArray(ReadableArray readableArray) {
        if ((readableArray == null) || (readableArray.size() == 0)) {
            return null;
        }

        switch (readableArray.getType(0)) {
            case String:
                return ArgumentsEx.toStringArray(readableArray);
            case Boolean:
                return ArgumentsEx.toBooleanArray(readableArray);
            case Number:
                // Can be int or double but we just assume double for now
                return ArgumentsEx.toDoubleArray(readableArray);
            case Map:
                return ArgumentsEx.toBundleArray(readableArray);
            case Array:
                throw new UnsupportedOperationException("Arrays of arrays is not supported");
            default:
                throw new UnsupportedOperationException("Type is not supported");
        }
    }

    /**
     * Convert a {@link WritableMap} to a {@link Bundle}.
     *
     * @param readableMap the {@link WritableMap} to convert.
     * @return the converted {@link Bundle}.
     */
    @NonNull
    public static Bundle toBundle(@Nullable ReadableMap readableMap) {
        if (readableMap == null) {
            return Bundle.EMPTY;
        }

        ReadableMapKeySetIterator iterator = readableMap.keySetIterator();

        Bundle bundle = new Bundle();
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            ReadableType readableType = readableMap.getType(key);
            switch (readableType) {
                case Null:
                    bundle.putString(key, null);
                    break;
                case Boolean:
                    bundle.putBoolean(key, readableMap.getBoolean(key));
                    break;
                case Number:
                    // Can be int or double.
                    bundle.putDouble(key, readableMap.getDouble(key));
                    break;
                case String:
                    bundle.putString(key, readableMap.getString(key));
                    break;
                case Map:
                    bundle.putBundle(key, toBundle(readableMap.getMap(key)));
                    break;
                case Array: {
                    ReadableArray readableArray = readableMap.getArray(key);
                    if(readableArray.size() > 0) {
                        switch (readableArray.getType(0)) {
                            case String:
                                bundle.putStringArray(key, ArgumentsEx.toStringArray(readableArray));
                                break;
                            case Boolean:
                                bundle.putBooleanArray(key, ArgumentsEx.toBooleanArray(readableArray));
                                break;
                            case Number:
                                // Can be int or double but we just assume double for now
                                bundle.putDoubleArray(key, ArgumentsEx.toDoubleArray(readableArray));
                                break;
                            case Map:
                                bundle.putParcelableArray(key, ArgumentsEx.toBundleArray(readableArray));
                                break;
                            case Array:
                                throw new UnsupportedOperationException("Arrays of arrays is not supported");
                        }
                    }
                }
                break;
                default:
                    throw new IllegalArgumentException("Could not convert object with key: " + key + ".");
            }
        }
        return bundle;
    }

    /**
     * Convert a {@link WritableMap} to a {@link Bundle}.
     *
     * @param readableMap the {@link WritableMap} to convert.
     * @return the converted {@link Bundle}.
     */
    @NonNull
    public static Bundle toBundle(@Nullable ReadableMap readableMap, @NonNull String key) {
        if (readableMap == null) {
            return Bundle.EMPTY;
        }

        Bundle bundle = new Bundle();
        ReadableType readableType = readableMap.getType(key);
        switch (readableType) {
            case Null:
                bundle.putString(key, null);
                break;
            case Boolean:
                bundle.putBoolean(key, readableMap.getBoolean(key));
                break;
            case Number:
                // Can be int or double.
                bundle.putDouble(key, readableMap.getDouble(key));
                break;
            case String:
                bundle.putString(key, readableMap.getString(key));
                break;
            case Map:
                bundle.putBundle(key, toBundle(readableMap.getMap(key)));
                break;
            case Array: {
                ReadableArray readableArray = readableMap.getArray(key);
                if (readableArray.size() > 0) {
                    switch (readableArray.getType(0)) {
                        case String:
                            bundle.putStringArray(key, ArgumentsEx.toStringArray(readableArray));
                            break;
                        case Boolean:
                            bundle.putBooleanArray(key, ArgumentsEx.toBooleanArray(readableArray));
                            break;
                        case Number:
                            // Can be int or double but we just assume double for now
                            bundle.putDoubleArray(key, ArgumentsEx.toDoubleArray(readableArray));
                            break;
                        case Map:
                            bundle.putParcelableArray(key, ArgumentsEx.toBundleArray(readableArray));
                            break;
                        case Array:
                            throw new UnsupportedOperationException("Arrays of arrays is not supported");
                    }
                }
            }
            break;
            default:
                throw new IllegalArgumentException("Could not convert object with key: " + key + ".");
        }
        return bundle;
    }

    public static Object getDataObject(@Nullable ReadableMap readableMap, @NonNull String key) {
        if (readableMap == null) {
            return null;
        }
        Object result = null;

        ReadableType readableType = readableMap.getType(key);
        switch (readableType) {
            case Null:
                result = null;
                break;
            case Boolean:
                result = readableMap.getBoolean(key);
                break;
            case Number:
                // Can be int or double.
                result = readableMap.getDouble(key);
                break;
            case String:
                result = readableMap.getString(key);
                break;
            case Map:
                result = toBundle(readableMap.getMap(key));
                break;
            case Array: {
                ReadableArray readableArray = readableMap.getArray(key);
                if (readableArray.size() > 0) {
                    switch (readableArray.getType(0)) {
                        case String:
                            result = ArgumentsEx.toStringArray(readableArray);
                            break;
                        case Boolean:
                            result = ArgumentsEx.toBooleanArray(readableArray);
                            break;
                        case Number:
                            // Can be int or double but we just assume double for now
                            result = ArgumentsEx.toDoubleArray(readableArray);
                            break;
                        case Map:
                            result = ArgumentsEx.toBundleArray(readableArray);
                            break;
                        case Array:
                            throw new UnsupportedOperationException("Arrays of arrays is not supported");
                    }
                }
            }
            break;
            default:
                throw new IllegalArgumentException("Could not convert object with key: " + key + ".");
        }

        return result;
    }
}
