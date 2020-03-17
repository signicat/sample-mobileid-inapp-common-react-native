package com.signicat.sampleapp.inapp;

import android.annotation.TargetApi;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.util.Log;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.encapsecurity.encap.android.client.api.Controller;
import com.encapsecurity.encap.android.client.api.PushMessage;
import com.encapsecurity.encap.android.client.api.PushMessageFactory;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.net.URISyntaxException;

public class FcmMessagingService extends FirebaseMessagingService {
    private static final String TAG = "InAppSample_Messaging";

    public FcmMessagingService() {
        super();
        Log.d(TAG, "Initializing FcmMessagingService");
    }

    /**
     * Called if InstanceID token is updated. This happens in the  following cases:
     * - App deletes Instance ID.
     * - App is restored on an new device.
     * - User Uninstalls/reinstall the app.
     * - User clears app data.
     *
     * @param token The new token
     */
    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "Refreshed token: " + token);
        if (token != null) {
            getEncapController().setPushRegistrationId(token);
        }
    }

    /**
     * Called when message is received.
     *
     * @param remoteMessage Object representing the message received from Firebase Cloud Messaging.
     */
    @Override
    public void onMessageReceived(final RemoteMessage remoteMessage) {
        final String pushMessageUrl = remoteMessage.getData().get(PushMessage.URL_KEY);
        Log.d(TAG, "Received FCM message: " + pushMessageUrl);

        processPushMessage(pushMessageUrl);
    }

    private void processPushMessage(final String pushMessageUrl) {
        try {
            final PushMessage pushMessage = PushMessageFactory.createFromUrl(pushMessageUrl);
            Log.d(TAG, "Received FCM message pushSessionId: " + pushMessage.getPushSessionId());
            getEncapController().setPushSessionId(pushMessage.getPushSessionId());

            if (pushMessage.isStartMessage() && (pushMessage.isAuthenticationMessage() || pushMessage.isSigningMessage())) {
                Log.d(TAG, "Start authentication");
                startAuthentication();
            } else {
                Log.w(TAG, "Received pushMessage " + pushMessage);
            }
        } catch (URISyntaxException e) {
            Log.d(TAG, "Unable to read push message: Error = " + e.getMessage());
        }
    }

    private void startAuthentication() {
        if (!isApplicationInForeground()) {
            Log.d(TAG, "Start InAppSample app, and show authentication");
            final Context context = getApplicationContext();
            final String packageName = context.getApplicationContext().getPackageName();

            // This will start the InAppSample app and send init=authentication as init param
            final Intent intent = context.getPackageManager().getLaunchIntentForPackage(packageName);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            intent.putExtra("init", "authentication");

            // after Android 10 (Q), notifications need to be handled in a specific way
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                showAuthenticationNotification(intent);
            } else {
                context.startActivity(intent);
            }
        } else {
            Log.d(TAG, "Go to authentication screen");

            // This will be received by EncapModule.registerPushReceiver
            final LocalBroadcastManager localBroadcastManager = LocalBroadcastManager.getInstance(this);
            final Intent customEvent = new Intent("fcm-push");
            localBroadcastManager.sendBroadcast(customEvent);
        }
    }

    @TargetApi(Build.VERSION_CODES.Q)
    private void showAuthenticationNotification(Intent intent) {
        Log.d(TAG, "showAuthenticationNotification");
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, 0);

        Bitmap largeIcon = BitmapFactory.decodeResource(getResources(), R.drawable.sample_notif_icon_large);

        Notification.Builder builder =
                new Notification.Builder(this, getString(R.string.notification_channel_id))
                        .setSmallIcon(R.drawable.sample_notif_icon)
                        .setLargeIcon(largeIcon)
                        .setContentTitle(getString(R.string.notification_authentication_title))
                        .setContentText(getString(R.string.notification_authentication_content))
                        .setPriority(Notification.PRIORITY_MAX)
                        .setCategory(Notification.CATEGORY_EVENT)
                        .setAutoCancel(true)
                        .setContentIntent(pendingIntent);

        Notification notification = builder.build();

        int notificationId = (int) (Math.random() * Integer.MAX_VALUE);
        Log.d(TAG, "notificationId: " + notificationId);

        NotificationManager notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            Log.d(TAG, "Sending notification...");
            notificationManager.notify(notificationId, notification);
        }
    }

    private boolean isApplicationInForeground() {
        return ((MainApplication) getApplication()).getAppInForegroundState();
    }


    private Controller getEncapController() {
        return ((MainApplication) getApplication()).getController();
    }
}
