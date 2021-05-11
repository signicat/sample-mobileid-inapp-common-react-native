package com.signicat.sampleapp.inapp;

import android.app.AlertDialog;
import android.app.Application;
import android.content.Context;
import android.util.Log;

import com.encapsecurity.encap.android.client.api.AndroidControllerFactory;
import com.encapsecurity.encap.android.client.api.Controller;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GooglePlayServicesUtil;

import java.lang.reflect.InvocationTargetException;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

    public static String TAG = "Signicat Sample InApp";

    private static Controller encapController;

    private boolean isAppInForeground = false;

    public void setAppInForegroundState(boolean isInForeground) {
        this.isAppInForeground = isInForeground;
    }

    public boolean getAppInForegroundState() {
        return this.isAppInForeground;
    }


    // Load Encap Library
    static {
        System.loadLibrary("encap-android-native-api");
    }

    private final ReactNativeHost mReactNativeHost =
            new ReactNativeHost(this) {
                @Override
                public boolean getUseDeveloperSupport() {
                    return BuildConfig.DEBUG;
                }

                @Override
                protected List<ReactPackage> getPackages() {
                    @SuppressWarnings("UnnecessaryLocalVariable")
                    List<ReactPackage> packages = new PackageList(this).getPackages();
                    // Packages that cannot be autolinked yet can be added manually here
                    packages.add(new SampleAppNativeBridgePackage());
                    return packages;
                }

                @Override
                protected String getJSMainModuleName() {
                    return "index";
                }
            };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        // initialize encap controller
        initializeEncapController();

        // Check device for Play Services APK. If check succeeds, proceed with FCM registration.
        if (!checkPlayServices()) {
            String errMsg = "No valid Google Play Services APK found.";
            Log.e(TAG, errMsg);
            AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(this);
            AlertDialog alertDialog = alertDialogBuilder.create();
            alertDialog.setMessage(errMsg);
            alertDialog.show();
        }

        SoLoader.init(this, /* native exopackage */ false);
        initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    }

    /**
     * Loads Flipper in React Native templates. Call this in the onCreate method with something like
     * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
     *
     * @param context
     * @param reactInstanceManager
     */
    private static void initializeFlipper(
            Context context, ReactInstanceManager reactInstanceManager) {
        if (BuildConfig.DEBUG) {
            try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
                Class<?> aClass = Class.forName("com.signicat.sampleapp.inapp.ReactNativeFlipper");
                aClass
                        .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
                        .invoke(null, context, reactInstanceManager);
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            } catch (NoSuchMethodException e) {
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            } catch (InvocationTargetException e) {
                e.printStackTrace();
            }
        }
    }

    private void initializeEncapController() {
        try {
            MainApplication.encapController = AndroidControllerFactory.getInstance(getBaseContext());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static Controller getController() {
        return MainApplication.encapController;
    }


    private boolean checkPlayServices() {
        Log.i(TAG,"Google play services check");
        int resultCode = GooglePlayServicesUtil.isGooglePlayServicesAvailable(this);
        if (resultCode != ConnectionResult.SUCCESS) {
            Log.e(TAG, "This device is not supported.");
            // TODO check if user can recover this on the fly and other stuffs
            return false;
        }

        Log.i(TAG,"Google play services available");
        return true;
    }

}
