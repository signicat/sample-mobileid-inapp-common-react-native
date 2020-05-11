package com.signicat.sampleapp.inapp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.encapsecurity.encap.android.client.api.AsyncCallback;
import com.encapsecurity.encap.android.client.api.AuthMethod;
import com.encapsecurity.encap.android.client.api.Controller;
import com.encapsecurity.encap.android.client.api.CancelSessionResult;
import com.encapsecurity.encap.android.client.api.DeactivateResult;
import com.encapsecurity.encap.android.client.api.DevicePinAuthParameter;
import com.encapsecurity.encap.android.client.api.FinishActivationResult;
import com.encapsecurity.encap.android.client.api.FinishAuthenticationResult;
import com.encapsecurity.encap.android.client.api.InputType;
import com.encapsecurity.encap.android.client.api.StartActivationResult;
import com.encapsecurity.encap.android.client.api.StartAuthenticationResult;
import com.encapsecurity.encap.android.client.api.exception.AuthenticationFailedException;
import com.encapsecurity.encap.android.client.api.exception.ErrorCode;
import com.encapsecurity.encap.android.client.api.exception.ErrorCodeException;
import com.encapsecurity.encap.android.client.util.StringUtil;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.firebase.iid.FirebaseInstanceId;

import java.util.List;


public class EncapModule extends ReactContextBaseJavaModule {

    public static final int PLAY_SERVICES_RESOLUTION_REQUEST = 9000;

    private static final String TAG = "InAppSample_EncapModule";
    private BroadcastReceiver broadcastReceiver;

    private StartActivationResult startActivationResult;
    private StartAuthenticationResult startAuthenticationResult;


    public EncapModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public void initialize() {
        super.initialize();
    }

    @Override
    public String getName() {
        return "EncapModule";
    }


    // Native Methods exposed to react-native
    @ReactMethod
    public void configureEncap(final String serverUrl, final String applicationId, final String publicKey, final Promise promise) {
        Log.d(TAG, "configureEncap. serverUrl: " + serverUrl + " applicationId: " + applicationId + " publicKey: " + publicKey);
        try {
            final Controller controller = getController();
            controller.setServerUrl(serverUrl);
            controller.setApplicationId(applicationId);
            controller.setPublicKey(publicKey);
            controller.setPushRegistrationId(FirebaseInstanceId.getInstance().getToken());
        } catch (Exception e) {
            promise.reject(e);
        }
        // register for FCM push message receiver
        registerPushReceiver();
        promise.resolve(true);
    }

    @ReactMethod
    public void isDeviceActivated(final Promise promise) {
        Log.d(TAG, "isDeviceActivated");
        promise.resolve(getController().isActivated());
    }

    @ReactMethod
    public void cancelSession(final Callback successCallback, final Callback errorCallback) {
        Log.d(TAG, "Cancel authentication");
        getController().cancelSession(new AsyncCallback<CancelSessionResult>() {
            @Override
            public void onSuccess(final CancelSessionResult cancelSessionResult) {
                invokeCallback(successCallback);
            }

            @Override
            public void onFailure(final ErrorCodeException e) {
                Log.d(TAG, e.toString());
                invokeErrorCallback(errorCallback, e);
            }
        });
    }

    @ReactMethod
    public void startActivation(final String activationCode, final Callback successCallback, final Callback errorCallback) {
        Log.d(TAG, "startActivation. ActivationCode = " + activationCode);
        getController().startActivation(activationCode, new AsyncCallback<StartActivationResult>() {

            public void onSuccess(final StartActivationResult result) {
                startActivationResult = result;
                int pinCodeLength = result.getMaxPinCodeLength();
                InputType pinCodeType = result.getPinCodeType();
                boolean hasFingerprint = result.getAllowedAuthMethods().contains(AuthMethod.DEVICE_ANDROID_FINGERPRINT);

                invokeCallback(successCallback, pinCodeLength, pinCodeType.name(), hasFingerprint);
            }

            public void onFailure(final ErrorCodeException e) {
                Log.d(TAG, e.toString());
                invokeErrorCallback(errorCallback, e);
            }
        });
    }

    @ReactMethod
    public void finishPinCodeActivation(final String pinCode, final Callback successCallback, final Callback errorCallback) {
        Log.d(TAG, "Finish activation with pinCode = " + pinCode);
        getController().finishActivation(new DevicePinAuthParameter(pinCode), new AsyncCallback<FinishActivationResult>() {

            @Override
            public void onSuccess(final FinishActivationResult ignored) {
                // Log.d(TAG, ignored.getResponseTitle());
                // Log.d(TAG, ignored.getResponseContent().toString());
                Log.d(TAG, "finishPinCodeActivation Success");
                invokeCallback(successCallback);
            }

            public void onFailure(final ErrorCodeException e) {
                Log.d(TAG, e.toString());
                invokeErrorCallback(errorCallback, e);
            }
        });
    }

    @ReactMethod
    public void deactivate(final Promise promise) {
        Log.d(TAG, "Deactivate...");
        // Deactivate only locally, and in the server
        getController().deactivate(false, new AsyncCallback<DeactivateResult>() {
            @Override
            public void onSuccess(final DeactivateResult deactivateResult) {
                promise.resolve(true);
            }

            @Override
            public void onFailure(final ErrorCodeException e) {
                Log.d(TAG, e.toString());
                promise.reject(TAG, "Error deactivating the device");
            }
        });
    }


    @ReactMethod
    public void getRegistrationId(final Promise promise) {
        final String registrationId = getController().getRegistrationId().toString();
        Log.d(TAG, "Has registrationId: " + registrationId);
        promise.resolve(registrationId);
    }

    @ReactMethod
    public void startAuthentication(final Callback successCallback, final Callback errorCallback) {
        Log.d(TAG, "Start authentication");
        getController().startAuthentication(new AsyncCallback<StartAuthenticationResult>() {
            @Override
            public void onSuccess(final StartAuthenticationResult result) {
                startAuthenticationResult = result;

                final List<AuthMethod> methods = result.getAllowedAuthMethods();
                final boolean hasPinCode = methods.contains(AuthMethod.DEVICE_PIN);
                final boolean hasFingerprint = methods.contains(AuthMethod.DEVICE_ANDROID_FINGERPRINT);
                final String contextTitle = result.getContextTitle() == null ? "" : result.getContextTitle().toString();
                final String contextContent = result.getContextContent() == null ? null : new String(result.getContextContent());

                invokeCallback(successCallback, hasPinCode, hasFingerprint, contextTitle, contextContent);
            }

            @Override
            public void onFailure(final ErrorCodeException e) {
                Log.d(TAG, e.toString());
                invokeErrorCallback(errorCallback, e);
            }
        });
    }

    @ReactMethod
    public void finishPinCodeAuthentication(final String pinCode, final Callback successCallback, final Callback errorCallback) {
        Log.d(TAG, "Finish authentication with pinCode = " + pinCode);
        getController().finishAuthentication(new DevicePinAuthParameter(pinCode), new AsyncCallback<FinishAuthenticationResult>() {
            @Override
            public void onSuccess(final FinishAuthenticationResult finishAuthenticationResult) {
                invokeCallback(successCallback);
            }

            @Override
            public void onFailure(final ErrorCodeException e) {
                Log.d(TAG, e.toString());
                invokeErrorCallback(errorCallback, e);
            }
        });
    }


    //--------------   Utility Methods

    private Controller getController() {
        return MainApplication.getController();
    }

    private void invokeCallback(Callback callback, Object... args) {
        try {
            callback.invoke(args);
        } catch (RuntimeException e) {
            Log.e(TAG, "Callback already called.", e);
        }
    }

    private void invokeErrorCallback(final Callback errorCallback, final ErrorCodeException e) {
        Log.e(TAG, "Failure", e);
        final String errorMessage = getLocalizationKey(e.getErrorCode());
        if (e instanceof AuthenticationFailedException) {
            final int remainingAttempts = ((AuthenticationFailedException) e).getRemainingAttempts();
            Log.d(TAG, "Authentication failed. Most likely wrong PIN. Remaining attempts = " + remainingAttempts);
            invokeCallback(errorCallback, errorMessage, remainingAttempts);
        } else {
            invokeCallback(errorCallback, errorMessage);
        }
    }

    private String getLocalizationKey(final ErrorCode errorCode) {
        final String name = errorCode.name();
        // ErrorCode name starts with "clientError" or "serverError", therefore the offset value is 11
        return StringUtil.toLowerSnakeAndCamelCase(name, '.', 11);
    }



    /* Received notification from FcmMessagingService and send a event to React Native code */
    private void registerPushReceiver() {
        Log.d(TAG, "registerPushReceiver");
        LocalBroadcastManager localBroadcastManager = LocalBroadcastManager.getInstance(getReactApplicationContext());
        if (broadcastReceiver != null) {
            Log.d(TAG, "Unregistering broadcastReceiver");
            localBroadcastManager.unregisterReceiver(broadcastReceiver);
        }
        Log.d(TAG, "Creating new broadcastReceiver");
        broadcastReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(final Context context, final Intent intent) {
                Log.d(TAG, "Received push event. Pass it on to callback");
                getReactApplicationContext()
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("authentication", null);
            }
        };
        Log.d(TAG, "Registering broadcastReceiver");
        localBroadcastManager.registerReceiver(broadcastReceiver, new IntentFilter("fcm-push"));
    }
}
