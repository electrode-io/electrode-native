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

import android.util.Log;

/**
 * Wrapper class for android's {@link Log}
 * <p/>
 * By default the log level is set to {@link LogLevel#ERROR}, if you want to override the log level call {@link Logger#overrideLogLevel(LogLevel)}
 * To turnOff logging, call {@link Logger#overrideLogLevel(LogLevel)} with {@link LogLevel#OFF}
 */
public final class Logger {

    public enum LogLevel {
        VERBOSE(Log.VERBOSE),
        DEBUG(Log.DEBUG),
        INFO(Log.INFO),
        WARN(Log.WARN),
        ERROR(Log.ERROR),
        OFF(0);

        private int level;

        LogLevel(int level) {

            this.level = level;

        }
    }

    private static LogLevel currentLogLevel = LogLevel.ERROR;

    private Logger() {
    }

    public static void overrideLogLevel(LogLevel level) {
        currentLogLevel = level;
    }

    /**
     * Send a {@link android.util.Log#VERBOSE} log message.
     *
     * @param tag Used to identify the source of a log message.  It usually identifies
     *            the class or activity where the log call occurs.
     * @param msg The message you would like logged.
     */
    public static int v(String tag, String msg, Object... args) {
        if (shouldLog(LogLevel.VERBOSE)) {
            return Log.v(tag, args != null ? String.format(msg, args) : msg);
        }
        return -1;
    }

    /**
     * Send a {@link android.util.Log#VERBOSE} log message and log the exception.
     *
     * @param tag Used to identify the source of a log message.  It usually identifies
     *            the class or activity where the log call occurs.
     * @param msg The message you would like logged.
     * @param tr  An exception to log
     */
    public static int v(String tag, String msg, Throwable tr) {
        if (shouldLog(LogLevel.VERBOSE)) {
            return Log.v(tag, msg, tr);
        }
        return -1;
    }

    /**
     * Send a {@link android.util.Log#DEBUG} log message.
     *
     * @param tag Used to identify the source of a log message.  It usually identifies
     *            the class or activity where the log call occurs.
     * @param msg The message you would like logged.
     */
    public static int d(String tag, String msg, Object... args) {
        if (shouldLog(LogLevel.DEBUG)) {
            return Log.d(tag, args != null ? String.format(msg, args) : msg);
        }
        return -1;
    }

    /**
     * Send a {@link android.util.Log#DEBUG} log message and log the exception.
     *
     * @param tag Used to identify the source of a log message.  It usually identifies
     *            the class or activity where the log call occurs.
     * @param msg The message you would like logged.
     * @param tr  An exception to log
     */
    public static int d(String tag, String msg, Throwable tr) {
        if (shouldLog(LogLevel.DEBUG)) {
            return Log.d(tag, msg, tr);
        }
        return -1;
    }

    /**
     * Send an {@link android.util.Log#INFO} log message.
     *
     * @param tag Used to identify the source of a log message.  It usually identifies
     *            the class or activity where the log call occurs.
     * @param msg The message you would like logged.
     */
    public static int i(String tag, String msg, Object... args) {
        if (shouldLog(LogLevel.INFO)) {
            return Log.i(tag, args != null ? String.format(msg, args) : msg);
        }
        return -1;
    }

    /**
     * Send a {@link android.util.Log#INFO} log message and log the exception.
     *
     * @param tag Used to identify the source of a log message.  It usually identifies
     *            the class or activity where the log call occurs.
     * @param msg The message you would like logged.
     * @param tr  An exception to log
     */
    public static int i(String tag, String msg, Throwable tr) {
        if (shouldLog(LogLevel.INFO)) {
            return Log.i(tag, msg, tr);
        }
        return -1;
    }

    /**
     * Send a {@link android.util.Log#WARN} log message.
     *
     * @param tag Used to identify the source of a log message.  It usually identifies
     *            the class or activity where the log call occurs.
     * @param msg The message you would like logged.
     */
    public static int w(String tag, String msg, Object... args) {
        if (shouldLog(LogLevel.WARN)) {
            return Log.w(tag, args != null ? String.format(msg, args) : msg);
        }
        return -1;
    }

    /**
     * Send a {@link android.util.Log#WARN} log message and log the exception.
     *
     * @param tag Used to identify the source of a log message.  It usually identifies
     *            the class or activity where the log call occurs.
     * @param msg The message you would like logged.
     * @param tr  An exception to log
     */
    public static int w(String tag, String msg, Throwable tr) {
        if (shouldLog(LogLevel.WARN)) {
            return Log.w(tag, msg, tr);
        }
        return -1;
    }

    /**
     * Send a {@link android.util.Log#WARN} log message and log the exception.
     *
     * @param tag Used to identify the source of a log message.  It usually identifies
     *            the class or activity where the log call occurs.
     * @param tr  An exception to log
     */
    public static int w(String tag, Throwable tr) {
        if (shouldLog(LogLevel.WARN)) {
            return Log.w(tag, tr);
        }
        return -1;
    }

    /**
     * Send an {@link android.util.Log#ERROR} log message.
     *
     * @param tag Used to identify the source of a log message.  It usually identifies
     *            the class or activity where the log call occurs.
     * @param msg The message you would like logged.
     */
    public static int e(String tag, String msg, Object... args) {
        if (shouldLog(LogLevel.ERROR)) {
            return Log.e(tag, args != null ? String.format(msg, args) : msg);
        }
        return -1;
    }

    /**
     * Send a {@link android.util.Log#ERROR} log message and log the exception.
     *
     * @param tag Used to identify the source of a log message.  It usually identifies
     *            the class or activity where the log call occurs.
     * @param msg The message you would like logged.
     * @param tr  An exception to log
     */
    public static int e(String tag, String msg, Throwable tr) {
        if (shouldLog(LogLevel.ERROR)) {
            return Log.w(tag, msg, tr);
        }
        return -1;
    }

    private static boolean shouldLog(LogLevel level) {
        return (level.ordinal() >= currentLogLevel.ordinal());
    }


}
