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

package com.walmartlabs.electrode.reactnative.bridge;

import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.walmartlabs.electrode.reactnative.bridge.helpers.ArgumentsEx;
import com.walmartlabs.electrode.reactnative.bridge.util.BridgeArguments;

import java.util.UUID;

public class BridgeMessage {

    /**
     * Represents the types of arguments that is sent across the bridge.
     */
    public enum Type {
        REQUEST("req"),
        RESPONSE("rsp"),
        EVENT("event");

        private String key;

        Type(@NonNull String key) {
            this.key = key;
        }

        public String getKey() {
            return key;
        }

        @Nullable
        public static Type getType(@NonNull String key) {
            for (Type type : Type.values()) {
                if (type.key.equalsIgnoreCase(key)) {
                    return type;
                }
            }
            return null;
        }
    }

    public static final String BRIDGE_MSG_NAME = "name";
    public static final String BRIDGE_MSG_ID = "id";
    public static final String BRIDGE_MSG_TYPE = "type";
    public static final String BRIDGE_MSG_DATA = "data";

    private final String name;
    private final String id;
    private final Type type;
    private final Object data;

    protected BridgeMessage(@NonNull String name, @NonNull String id, @NonNull Type type, @Nullable Object data) {
        this.name = name;
        this.id = id;
        this.type = type;
        this.data = data;
    }

    protected BridgeMessage(@NonNull ReadableMap messageMap) {
        if (isValid(messageMap)) {
            name = messageMap.getString(BRIDGE_MSG_NAME);
            id = messageMap.getString(BRIDGE_MSG_ID);

            type = Type.getType(messageMap.getString(BRIDGE_MSG_TYPE));
            if (type == null) {
                throw new IllegalArgumentException("Invalid type(" + messageMap.getString(BRIDGE_MSG_TYPE) + ") received. Unable to construct BridgeMessage");
            }

            if (messageMap.hasKey(BRIDGE_MSG_DATA)) {
                data = ArgumentsEx.getDataObject(messageMap, BRIDGE_MSG_DATA);
            } else {
                data = null;
            }
        } else {
            name = null;
            id = null;
            type = null;
            data = null;
            throw new IllegalArgumentException("Invalid data received. Unable to construct BridgeMessage");
        }
    }

    /**
     * Unique name of the message.
     *
     * @return String
     */
    @NonNull
    public String getName() {
        return name;
    }

    /**
     * Unique ID representing the bridge message.
     *
     * @return String
     */
    @NonNull
    public String getId() {
        return id;
    }

    /**
     * Type of the message
     *
     * @return Type
     */
    @NonNull
    public Type getType() {
        return type;
    }

    /**
     * Data that is being passed
     *
     * @return Object
     */
    @Nullable
    public Object getData() {
        return data;
    }

    /**
     * Returns a writable map representation of {@link BridgeMessage}
     *
     * @return WritableMap
     */
    @NonNull
    public WritableMap map() {
        WritableMap writableMap = Arguments.createMap();
        writableMap.putString(BRIDGE_MSG_ID, getId());
        writableMap.putString(BRIDGE_MSG_NAME, getName());

        WritableMap dataMap;
        if (data instanceof Bundle) {
            dataMap = Arguments.fromBundle((Bundle) data);
        } else {
            dataMap = Arguments.fromBundle(BridgeArguments.generateDataBundle(data));
        }
        writableMap.merge(dataMap);

        writableMap.putString(BRIDGE_MSG_TYPE, type.key);
        return writableMap;
    }

    @Override
    public String toString() {
        return "name:" + name + ", id:" + id + ", data:" + data + " type:" + type;
    }

    static boolean isValid(final ReadableMap data, Type type) {
        return isValid(data)
                && Type.getType(data.getString(BRIDGE_MSG_TYPE)) == type;
    }

    static boolean isValid(final ReadableMap data) {
        return data != null
                && data.hasKey(BRIDGE_MSG_NAME)
                && data.hasKey(BRIDGE_MSG_ID)
                && data.hasKey(BRIDGE_MSG_TYPE);
    }

    static String getUUID() {
        return UUID.randomUUID().toString();
    }
}
