package com.signicat.sampleapp.inapp;

import android.annotation.TargetApi;
import android.app.Activity;
import android.app.Application;
import android.app.FragmentManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;


public class MainActivity extends ReactActivity {

  public static String TAG = "Signicat Sample InApp";


  // Returns the name of the main component registered from JavaScript.
  @Override
  protected String getMainComponentName() {
    return "InAppSample";
  }


  @Override
  public void onCreate(Bundle savedInstanceState) {
    setTheme(R.style.AppTheme);
    super.onCreate(savedInstanceState);

    this.getApplication().registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks() {
      // The code in here will run not just for this activity but for ALL activites in this app

      @Override
      public void onActivityCreated(Activity activity, Bundle bundle) {}

      @Override
      public void onActivityStarted(Activity activity) {
      }

      @Override
      public void onActivityResumed(Activity activity) {
        Log.d(TAG, "onActivityResumed");
        MainApplication mainApp = (MainApplication) activity.getApplication();
        mainApp.setAppInForegroundState(true);
      }

      @Override
      public void onActivityPaused(Activity activity) {
        Log.d(TAG, "onActivityPaused"); // Runs after Linking.openURL in React Native JS code
        MainApplication mainApp = (MainApplication) activity.getApplication();
        mainApp.setAppInForegroundState(false);
      }

      @Override
      public void onActivityStopped(Activity activity) { // WON'T RUN after Linking.openURL in React Native JS code
        Log.d(TAG, "onActivityStopped");
      }

      @Override
      public void onActivitySaveInstanceState(Activity activity, Bundle bundle) {}

      @Override
      public void onActivityDestroyed(Activity activity) {}
    });

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) { // Q = Android 10 (API Level 29)
      this.createNotificationChannel(); // This is currently only needed for Android 10+
    }
  }

  // pass init props to react-native
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName()) {
      @Nullable
      @Override
      protected Bundle getLaunchOptions() {
        Bundle bundle = getPlainActivity().getIntent().getExtras();
        return bundle;
      }
    };
  }


  // setup the notification channel to handle incoming push notifications
  @TargetApi(Build.VERSION_CODES.Q)
  private void createNotificationChannel() {
    String channelId = getString(R.string.notification_channel_id);
    CharSequence name = getString(R.string.notification_channel_name);
    String description = getString(R.string.notification_channel_desc);
    int importance = NotificationManager.IMPORTANCE_HIGH;
    NotificationChannel channel = new NotificationChannel(channelId, name, importance);
    channel.setDescription(description);
    NotificationManager notificationManager = getSystemService(NotificationManager.class);
    if (notificationManager != null) {
      notificationManager.createNotificationChannel(channel);
      Log.d(TAG, "createNotificationChannel succeeded");
    } else {
      Log.d(TAG, "createNotificationChannel failed");
    }
  }

  public void showFragmentDialog(DialogFragment dialog, String tag) {
    dialog.show(getSupportFragmentManager(), tag);
  }
}
