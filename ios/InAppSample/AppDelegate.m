#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <RNCPushNotificationIOS.h>

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>
static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  #ifdef FB_SONARKIT_ENABLED
    InitializeFlipper(application);
  #endif

  // wrt initial props
  NSMutableDictionary *initialPropertiesDict = [[NSMutableDictionary alloc]init];

   if (launchOptions != nil) {
     NSLog(@"launchOptions: %@", [launchOptions description]);
     NSDictionary *pushNotificationDict = [launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
     // If the app is launched from push notification, init property should be set to authentication!
     if(pushNotificationDict != nil) {
       initialPropertiesDict = [[NSMutableDictionary alloc]initWithDictionary:pushNotificationDict];
       [initialPropertiesDict setObject:@"authentication" forKey:@"init"];
     } else {
       // otherwise just forward existing props in launchOptions
       [initialPropertiesDict addEntriesFromDictionary: launchOptions];
     }
   }

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"InAppSample"
                                            initialProperties:initialPropertiesDict];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  //initialize EncapModule
  self.encapModule = [[EncapModule alloc] init];

  //configure push. This will be needed if authentication is to be started from a website
  self.encapPush = [[EncapPush alloc] initWithDelegate:self.encapModule];
  [self.encapPush didFinishLaunchingWithOptions:launchOptions];

  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

#pragma mark - Push

// Required for the register event.
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  NSLog(@"Inside didRegisterForRemoteNotificationsWithDeviceToken. Device token: %@ %@", self.encapPush.deviceToken, deviceToken);
  self.encapPush.deviceToken = deviceToken;

  [RNCPushNotificationIOS didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Required to register for notifications
- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings {
  NSLog(@"Inside didRegisterUserNotificationSettings");
  [application registerForRemoteNotifications];

  [RNCPushNotificationIOS didRegisterUserNotificationSettings:notificationSettings];
}

// Required for the registrationError event.
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  //    [EncapTestUtils showMessage:[error localizedDescription] withTitle:@"Registering Push Failed"];
  NSLog(@"Inside Registering Push Failed: %@", [error description]);

  [RNCPushNotificationIOS didFailToRegisterForRemoteNotificationsWithError:error];
}

// Required for the notification event. For to make react-native aware, completion handler must be called with here.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  NSLog(@"Inside didReceiveRemoteNotification");

  BOOL isPushEnabled = [[[UIApplication sharedApplication] currentUserNotificationSettings] types] != UIUserNotificationTypeNone;
  if (isPushEnabled) {
    [self.encapPush didReceiveRemoteNotification:userInfo];
    [RNCPushNotificationIOS didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
  }
}

// Required for the localNotification event.
- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
  NSLog(@"Inside didReceiveLocalNotification");
  [RNCPushNotificationIOS didReceiveLocalNotification:notification];
}

@end
