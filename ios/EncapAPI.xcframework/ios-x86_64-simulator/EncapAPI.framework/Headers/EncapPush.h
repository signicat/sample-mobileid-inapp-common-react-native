//
//  EncapPush.h
//  Encap
//
//  Copyright (c) 2013 Encap. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "EncapTypes.h"


/** 
 * Delegate protocol for EncapPush
 */
@protocol EncapPushDelegate <NSObject>

/**
 * Requests the application to begin the activation process. Show the activation UI and begin interaction with EncapController.
 *
 * @param pushSessionId         Required for activation and authentication requests if platform.pushValidation is set to TRUE on server.
 * @param launching             TRUE if application is launching, i.e. didFinishLaunchingWithOptions triggered this call.
 */
- (void) activateWithPushSessionId:(NSNumber * _Nonnull)pushSessionId
                         launching:(BOOL)launching;

/**
 * Requests the application to begin the authentication process. Show the authentication UI and begin interaction with EncapController.
 *
 * @param pushSessionId Required for activation and authentication requests if platform.pushValidation is set to TRUE on server.
 * @param launching     TRUE if application is launching, i.e. didFinishLaunchingWithOptions triggered this call.
 */
- (void) authenticateWithPushSessionId:(NSNumber * _Nonnull)pushSessionId
                             launching:(BOOL)launching;

/**
 * Requests the application to begin the signing process.
 * Show the signature UI and begin interaction with EncapController.
 *
 * @param pushSessionId Required for activation and authentication requests if platform.pushValidation is set to TRUE on server.
 * @param launching     TRUE if application is launching, i.e. didFinishLaunchingWithOptions triggered this call.
 */
- (void) signWithPushSessionId:(NSNumber * _Nonnull)pushSessionId
                     launching:(BOOL)launching;

@end

/**
 * EncapPush class
 */
@interface EncapPush : NSObject

/** 
 * Device token received in application:didRegisterForRemoteNotificationsWithDeviceToken: method 
 */
@property (strong, nullable) NSData *deviceToken;

/**
 * Init method
 *
 * @param delegate The delegate object for EncapPush.
 */
- (id _Nonnull) initWithDelegate:(id<EncapPushDelegate>_Nonnull)delegate;

/**
 * Call this when application:didFinishLaunchingWithOptions: method is invoked for applications UIApplicationDelegate
 *
 * @param   launchOptions A dictionary indicating the reason the application was launched (if any).
 * @return  TRUE if EncapPush handled the message, otherwise FALSE.
 */
- (BOOL) didFinishLaunchingWithOptions:(NSDictionary * _Nullable)launchOptions;

/**
 * Call this when application:didReceiveRemoteNotification: method is invoked for applications UIApplicationDelegate
 *
 * @param   userInfo A dictionary that contains information related to the remote notification.
 * @return  TRUE if EncapPush handled the message, otherwise FALSE.
 */
- (BOOL) didReceiveRemoteNotification:(NSDictionary * _Nonnull)userInfo;

/**
 * Call this method to get the customPushPayload
 *
 * @param   userInfo A dictionary that contains information related to the remote notification received in didReceiveRemoteNotification.
 * @return  NSString if customPushPayload is present, or nil if not used.
 */
- (nullable NSString *) customPushPayload:(NSDictionary * _Nonnull)userInfo;

@end
