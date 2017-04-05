package com.walmartlabs.ern.api;

import android.support.annotation.NonNull;

import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeEventListener;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeRequestHandler;
import com.walmartlabs.electrode.reactnative.bridge.ElectrodeBridgeResponseListener;
import com.walmartlabs.electrode.reactnative.bridge.None;
import java.util.*;
import com.walmartlabs.ern.model.User;
import java.util.*;

public final class UserApi {
    private static final Requests REQUESTS;

    static {
        REQUESTS = new UserRequests();
    }

    private UserApi() {
    }

    @NonNull
    public static Requests requests() {
        return REQUESTS;
    }



    public interface Requests {
        String REQUEST_CREATE_USER = "com.walmartlabs.ern.api.request.createUser";
        String REQUEST_CREATE_USERS_WITH_ARRAY_INPUT = "com.walmartlabs.ern.api.request.createUsersWithArrayInput";
        String REQUEST_CREATE_USERS_WITH_LIST_INPUT = "com.walmartlabs.ern.api.request.createUsersWithListInput";
        String REQUEST_DELETE_USER = "com.walmartlabs.ern.api.request.deleteUser";
        String REQUEST_GET_USER_BY_NAME = "com.walmartlabs.ern.api.request.getUserByName";
        String REQUEST_LOGIN_USER = "com.walmartlabs.ern.api.request.loginUser";
        String REQUEST_LOGOUT_USER = "com.walmartlabs.ern.api.request.logoutUser";
        String REQUEST_UPDATE_USER = "com.walmartlabs.ern.api.request.updateUser";


        void registerCreateUserRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<User, None> handler);

        void registerCreateUsersWithArrayInputRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<List<User>, None> handler);

        void registerCreateUsersWithListInputRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<List<User>, None> handler);

        void registerDeleteUserRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, None> handler);

        void registerGetUserByNameRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<String, User> handler);

        void registerLoginUserRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<LoginUserData, String> handler);

        void registerLogoutUserRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<None, None> handler);

        void registerUpdateUserRequestHandler(@NonNull final ElectrodeBridgeRequestHandler<UpdateUserData, None> handler);

        void createUser(User body, @NonNull final ElectrodeBridgeResponseListener<None> responseListener);

        void createUsersWithArrayInput(List<User> body, @NonNull final ElectrodeBridgeResponseListener<None> responseListener);

        void createUsersWithListInput(List<User> body, @NonNull final ElectrodeBridgeResponseListener<None> responseListener);

        void deleteUser(String username, @NonNull final ElectrodeBridgeResponseListener<None> responseListener);

        void getUserByName(String username, @NonNull final ElectrodeBridgeResponseListener<User> responseListener);

        void loginUser(LoginUserData loginUserData, @NonNull final ElectrodeBridgeResponseListener<String> responseListener);

        void logoutUser(@NonNull final ElectrodeBridgeResponseListener<None> responseListener);

        void updateUser(UpdateUserData updateUserData, @NonNull final ElectrodeBridgeResponseListener<None> responseListener);

    }
}