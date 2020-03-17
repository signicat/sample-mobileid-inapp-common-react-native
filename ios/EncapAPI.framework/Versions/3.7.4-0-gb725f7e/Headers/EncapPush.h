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
- (void) activateWithPushSessionId:(NSNumber *)pushSessionId
                         launching:(BOOL)launching;

/**
 * Requests the application to begin the authentication process. Show the authentication UI and begin interaction with EncapController.
 *
 * @param pushSessionId Required for activation and authentication requests if platform.pushValidation is set to TRUE on server.
 * @param launching     TRUE if application is launching, i.e. didFinishLaunchingWithOptions triggered this call.
 */
- (void) authenticateWithPushSessionId:(NSNumber *)pushSessionId
                             launching:(BOOL)launching;

/**
 * Requests the application to begin the signing process.
 * Show the signature UI and begin interaction with EncapController.
 *
 * @param pushSessionId Required for activation and authentication requests if platform.pushValidation is set to TRUE on server.
 * @param launching     TRUE if application is launching, i.e. didFinishLaunchingWithOptions triggered this call.
 */
- (void) signWithPushSessionId:(NSNumber *)pushSessionId
                     launching:(BOOL)launching;

@end

/**
 * EncapPush class
 */
@interface EncapPush : NSObject

/** 
 * Device token received in application:didRegisterForRemoteNotificationsWithDeviceToken: method 
 */
@property (strong) NSData *deviceToken;

/**
 * Init method
 *
 * @param delegate The delegate object for EncapPush.
 */
- (id) initWithDelegate:(id<EncapPushDelegate>)delegate;

/**
 * Call this when application:didFinishLaunchingWithOptions: method is invoked for applications UIApplicationDelegate
 *
 * @param   launchOptions A dictionary indicating the reason the application was launched (if any).
 * @return  TRUE if EncapPush handled the message, otherwise FALSE.
 */
- (BOOL) didFinishLaunchingWithOptions:(NSDictionary *)launchOptions;
/**
 * Call this when application:didReceiveRemoteNotification: method is invoked for applications UIApplicationDelegate
 *
 * @param   userInfo A dictionary that contains information related to the remote notification.
 * @return  TRUE if EncapPush handled the message, otherwise FALSE.
 */
- (BOOL) didReceiveRemoteNotification:(NSDictionary *)userInfo;

@end
