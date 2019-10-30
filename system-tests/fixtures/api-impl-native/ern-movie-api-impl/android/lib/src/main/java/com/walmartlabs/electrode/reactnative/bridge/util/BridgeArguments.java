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

package com.walmartlabs.electrode.reactnative.bridge.util;

import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.annotation.VisibleForTesting;

import com.walmartlabs.electrode.reactnative.bridge.BridgeMessage;
import com.walmartlabs.electrode.reactnative.bridge.Bridgeable;
import com.walmartlabs.electrode.reactnative.bridge.helpers.Logger;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * This class contains utility methods for bridge
 */

public final class BridgeArguments {

    private static final String TAG = BridgeArguments.class.getSimpleName();

    private static final Set<Class> SUPPORTED_PRIMITIVE_TYPES = new HashSet<Class>() {{
        add(String.class);
        add(String[].class);
        add(Integer.class);
        add(Integer[].class);
        add(int[].class);
        add(Boolean.class);
        add(Boolean[].class);
        add(boolean[].class);
        add(Double.class);
        add(Double[].class);
        add(double[].class);
        add(Float.class);
        add(Float[].class);
        add(float[].class);
        add(Number.class);
    }};

    /**
     * @param object Accepted object types are {@link Bridgeable}, All primitive wrappers and null
     * @return Bundle representation of the given object. The output bundle will put the object inside key = {@link BridgeMessage#BRIDGE_MSG_DATA}
     */
    @NonNull
    public static Bundle generateDataBundle(@Nullable Object object) {
        if (object == null) {
            return Bundle.EMPTY;
        }
        Bundle data = new Bundle();
        if (object instanceof Bridgeable) {
            data.putBundle(BridgeMessage.BRIDGE_MSG_DATA, ((Bridgeable) object).toBundle());
        } else if (object instanceof List) {
            updateBundleWithList((List) object, data);
        } else {
            updateBundleForPrimitive(object, object.getClass(), data);
        }

        return data;
    }

    private static void updateBundleWithList(@NonNull List objList, Bundle bundle) {
        updateBundleWithList(objList, bundle, BridgeMessage.BRIDGE_MSG_DATA);
    }

    /**
     * Helper method to convert a list of object to be put inside a bundle
     *
     * @param objList List of items
     * @param bundle  bundle that needs to be populated
     * @param key     key to be used while putting the array into the bundle
     */
    public static void updateBundleWithList(@NonNull List objList, @NonNull Bundle bundle, @NonNull String key) {
        if (!objList.isEmpty()) {
            Object firstItem = null;
            for (Object o : objList) {
                if (o != null) {
                    firstItem = o;
                    break;
                }
            }

            if (firstItem == null) {
                bundle.putParcelableArray(key, new Bundle[0]);
            }

            if (firstItem instanceof Bridgeable) {
                bundle.putParcelableArray(key, bridgeablesToBundleArray(objList));
            } else if (isSupportedPrimitiveType(firstItem.getClass())) {
                int arraySize = objList.size();
                if (firstItem instanceof String) {
                    String[] stringArray = (String[]) objList.toArray(new String[arraySize]);
                    bundle.putStringArray(key, stringArray);
                } else if (firstItem instanceof Integer) {
                    Logger.d(TAG, "converting List<Integer> to int[]");
                    int[] intArray = new int[arraySize];
                    for (int i = 0; i < arraySize; i++) {
                        intArray[i] = (Integer) objList.get(i);
                    }
                    bundle.putIntArray(key, intArray);
                } else if (firstItem instanceof Double) {
                    Logger.d(TAG, "converting List<Double> to double[]");
                    double[] doubleArray = new double[arraySize];
                    for (int i = 0; i < arraySize; i++) {
                        doubleArray[i] = (double) objList.get(i);
                    }
                    bundle.putDoubleArray(key, doubleArray);
                } else if (firstItem instanceof Boolean) {
                    Logger.d(TAG, "converting List<Boolean> to boolean[]");
                    boolean[] boolArray = new boolean[arraySize];
                    for (int i = 0; i < arraySize; i++) {
                        boolArray[i] = (boolean) objList.get(i);
                    }
                    bundle.putBooleanArray(key, boolArray);
                } else if (firstItem instanceof Float) {
                    Logger.d(TAG, "converting List<Float> to float[]");
                    float[] floatArray = new float[arraySize];
                    for (int i = 0; i < arraySize; i++) {
                        floatArray[i] = (float) objList.get(i);
                    }
                    bundle.putFloatArray(key, floatArray);
                } else {
                    throw new IllegalArgumentException("Should never happen, looks like logic to handle " + firstItem.getClass() + " is not implemented yet");
                }
            } else {
                throw new IllegalArgumentException("should never reach here, type" + firstItem.getClass() + " not supported yet");
            }

        } else {
            Logger.d(TAG, "Received empty list, will put empty bundle array(parcelable) for key:%s", key);
            bundle.putParcelableArray(key, new Bundle[0]);
        }
    }

    @NonNull
    public static Bundle[] bridgeablesToBundleArray(@NonNull List objList) {
        Bundle[] bundleList = new Bundle[objList.size()];
        for (int i = 0; i < objList.size(); i++) {
            Object obj = objList.get(i);
            if (obj instanceof Bridgeable) {
                bundleList[i] = (((Bridgeable) obj).toBundle());
            } else {
                throw new IllegalArgumentException("Should never reach here, received a non-bridgeable object, " + obj);
            }
        }
        return bundleList;
    }

    /**
     * Looks for an entry with key = {@link BridgeMessage#BRIDGE_MSG_DATA} inside the bundle and then tries to convert the value to either a primitive wrapper or {@link Bridgeable}
     *
     * @param data        {@link Object} data that may need to be casted to a specific type. Mainly for complex objects returned by React will be in form of Bundle.
     * @param returnClass {@link Class} expected return type of the Object
     * @return Object
     */
    @Nullable
    public static Object generateObject(@Nullable Object data, @NonNull Class<?> returnClass) {

        if (data == null) {
            return null;
        }

        if (returnClass.isAssignableFrom(data.getClass())) {
            Logger.d(TAG, "Object conversion not required since the data is already of type(%s)", returnClass);
            return data;
        }

        Object response;
        if (data instanceof List) {
            //When native sends a request the data will already be a list, does not require  a conversion
            response = data;
        } else if (isArray(data)) {
            response = getList(data, returnClass);
        } else if (data instanceof Bundle) {
            response = objectFromBundle((Bundle) data, returnClass);
        } else if (isSupportedPrimitiveType(data.getClass())) {
            //noinspection unchecked
            response = data;
        } else {
            throw new IllegalArgumentException("Should never happen, looks like logic to handle " + data.getClass() + " type is not implemented yet, returnClass:" + returnClass);
        }

        return preProcessObject(response, returnClass);
    }


    private static boolean isArray(@NonNull Object obj) {
        return obj.getClass().isArray();
    }

    /**
     * @param obj           input array
     * @param listItemClass Defines the content type of the list
     * @return List<listItemClass>
     */
    public static List getList(@Nullable Object obj, @NonNull Class listItemClass) {
        if (obj == null) {
            return new ArrayList<>();
        }

        if (!isArray(obj)) {
            throw new IllegalArgumentException("Should never reach here, expected an array, received: " + obj);
        }

        List<Object> convertedList = new ArrayList<>();
        if (obj.getClass().isAssignableFrom(Bundle[].class)) {
            for (Object bundle : (Object[]) obj) {
                Object item = BridgeArguments.objectFromBundle((Bundle) bundle, listItemClass);
                convertedList.add(item);
            }

        } else if (isSupportedPrimitiveType(obj.getClass())) {
            if (Object[].class.isAssignableFrom(obj.getClass())) {
                Collections.addAll(convertedList, (Object[]) obj);
            } else if (int[].class.isAssignableFrom(obj.getClass())) {
                int[] objectArray = (int[]) obj;
                for (Object o : objectArray) {
                    convertedList.add(o);
                }
            } else if (double[].class.isAssignableFrom(obj.getClass())) {
                double[] objectArray = (double[]) obj;
                for (Object o : objectArray) {
                    convertedList.add(o);
                }
            } else if (boolean[].class.isAssignableFrom(obj.getClass())) {
                boolean[] boolArray = (boolean[]) obj;
                for (Object o : boolArray) {
                    convertedList.add(o);
                }
            } else if (float[].class.isAssignableFrom(obj.getClass())) {
                float[] floatArray = (float[]) obj;
                for (Object o : floatArray) {
                    convertedList.add(o);
                }
            } else {
                throw new IllegalArgumentException("Array of type " + obj.getClass().getSimpleName() + " is not supported yet");
            }
        } else {
            throw new IllegalArgumentException("Array of type " + obj.getClass().getSimpleName() + " is not supported yet");
        }

        return updateListResponseIfRequired(convertedList, listItemClass);
    }

    @VisibleForTesting
    @NonNull
    static Object objectFromBundle(@NonNull Bundle bundle, @NonNull Class<?> clazz) {
        Logger.d(TAG, "entering objectFromBundle with bundle(%s) for class(%s)", bundle, clazz);

        //noinspection TryWithIdenticalCatches
        try {
            Class clz = Class.forName(clazz.getName());
            Constructor[] constructors = clz.getDeclaredConstructors();
            for (Constructor constructor : constructors) {
                if (constructor.getParameterTypes().length == 1) {
                    if (constructor.getParameterTypes()[0].isInstance(bundle)) {
                        Object[] args = new Object[1];
                        args[0] = bundle;
                        Object result = constructor.newInstance(args);
                        if (clazz.isInstance(result)) {
                            //noinspection unchecked
                            return result;
                        } else {
                            Logger.w(TAG, "Object creation from bundle not possible since the created object(%s) is not an instance of %s", result, clazz);
                        }
                    }
                    //Empty constructor available, object construction using bundle can now be attempted.
                    break;
                }
            }
            Logger.w(TAG, "Could not find a constructor that takes in a Bundle param for class(%s)", clazz);
        } catch (ClassNotFoundException e) {
            logException(e);
        } catch (@SuppressWarnings("TryWithIdenticalCatches") InstantiationException e) {
            logException(e);
        } catch (IllegalAccessException e) {
            logException(e);
        } catch (InvocationTargetException e) {
            logException(e);
        }

        throw new IllegalArgumentException("Unable to generate a Bridgeable from bundle: " + bundle);
    }

    private static Object preProcessObject(Object object, Class expectedObjectType) {
        if (object instanceof List) {
            runValidationForListResponse(object, expectedObjectType);
        } else if (Number.class.isAssignableFrom(expectedObjectType)) {
            object = updateNumberResponseToMatchReturnType(object, expectedObjectType);
        }
        return object;
    }

    /**
     * @param listResponse response object
     * @param listItemType list content type
     * @return List
     */
    //Needed since any response that is coming back from JS will only have number.
    private static List updateListResponseIfRequired(List listResponse, @NonNull Class listItemType) {
        if (!listResponse.isEmpty()
                && isNumberAndNeedsConversion(listResponse.get(0), listItemType)) {
            Logger.d(TAG, "Performing list Number conversion from %s to %s", listResponse.get(0).getClass(), listItemType);
            List<Number> updatedResponse = new ArrayList<>(listResponse.size());
            for (Object number : listResponse) {
                updatedResponse.add(convertToNumberToResponseType((Number) number, listItemType));
            }
            return updatedResponse;
        }
        return listResponse;
    }

    private static Object updateNumberResponseToMatchReturnType(@NonNull Object response, @NonNull Class responseType) {

        if (isNumberAndNeedsConversion(response, responseType)) {
            Logger.d(TAG, "Performing Number conversion from %s to %s", response.getClass(), responseType);
            return convertToNumberToResponseType((Number) response, responseType);
        } else {
            return response;
        }
    }

    @SuppressWarnings("unchecked")
    private static void runValidationForListResponse(Object response, Class expectedResponseType) {
        if (response instanceof List) {
            //Ensure the list content is matching the responseType. This is a workaround to eliminate the limitation of generics preventing the List type being represented inside Class.
            if (!((List) response).isEmpty()) {
                if (!expectedResponseType.isAssignableFrom(((List) response).get(0).getClass())) {
                    throw new IllegalArgumentException("Expected List<" + expectedResponseType + "> but received List<" + ((List) response).get(0).getClass().getSimpleName() + ">");
                }
            }
        }
    }

    @NonNull
    private static Number convertToNumberToResponseType(@NonNull Number response, @NonNull Class responseType) {
        if (responseType == Integer.class) {
            return response.intValue();
        } else {
            return response;
        }
    }

    private static boolean isNumberAndNeedsConversion(@NonNull Object obj, Class responseType) {
        return !responseType.getClass().isAssignableFrom(obj.getClass())//Make sure the expected type and actual type are not same
                && Number.class.isAssignableFrom(obj.getClass())
                && Number.class.isAssignableFrom(responseType);
    }

    private static void logException(Exception e) {
        Logger.w(TAG, "FromBundle failed to execute(%s)", e.getMessage() != null ? e.getMessage() : e.getCause());
    }

    @NonNull
    @VisibleForTesting
    static Bundle updateBundleForPrimitive(@NonNull Object respObj, @NonNull Class respClass, @NonNull Bundle bundle) {
        String key = BridgeMessage.BRIDGE_MSG_DATA;
        if (String.class.isAssignableFrom(respClass)) {
            bundle.putString(key, (String) respObj);
        } else if (Integer.class.isAssignableFrom(respClass)) {
            bundle.putInt(key, (Integer) respObj);
        } else if (Boolean.class.isAssignableFrom(respClass)) {
            bundle.putBoolean(key, (Boolean) respObj);
        } else if (String[].class.isAssignableFrom(respClass)) {
            bundle.putStringArray(key, (String[]) respObj);
        } else {
            throw new IllegalArgumentException("Should never happen, looks like logic to handle " + respClass + " is not implemented yet");
        }
        return bundle;
    }

    public static Number getNumberValue(@NonNull Bundle bundle, String key) {
        Number output = null;
        if (bundle != null && bundle.containsKey(key)) {
            Object obj = bundle.get(key);
            if (obj != null) {
                if (obj.getClass().isAssignableFrom(Integer.class)) {
                    output = bundle.getInt(key);
                } else if (obj.getClass().isAssignableFrom(Double.class)) {
                    output = bundle.getDouble(key);
                }
            }
        }
        return output;
    }

    /**
     * Converts a list of {@link Integer} to int[], any null value will be replaced with 0 inside the array
     *
     * @param integerList {@link List<Integer>}
     * @return int[]
     */
    public static int[] toIntArray(@NonNull List<Integer> integerList) {
        int array[] = new int[integerList.size()];

        for (int i = 0; i < integerList.size(); i++) {
            if (integerList.get(i) != null) {
                array[i] = integerList.get(i);
            }
        }
        return array;

    }

    private static boolean isSupportedPrimitiveType(@NonNull Class clazz) {
        return SUPPORTED_PRIMITIVE_TYPES.contains(clazz);
    }
}
