//
//  EncapAuthParameter.h
//  Encap
//
//  Copyright (c) 2014 Encap. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "EncapTypes.h"


@interface EncapAuthParameter : NSObject

- (EncapAuthMethod)authMethod;

@end


@interface EncapActivationParameters : NSObject

@property (strong, nonnull) EncapAuthParameter *authParameter;

- (nonnull instancetype) initWithAuthParameter:(nonnull EncapAuthParameter*)authParameter;

@end



@interface EncapDeviceAuthParameter : EncapAuthParameter

@end



@interface EncapDevicePinAuthParameter : EncapAuthParameter

@property (strong, nonnull) NSString *pinCode;

- (nonnull instancetype) initWithPinCode:(nonnull NSString*)pinCode;

@end



/* Using kSecAccessControlUserPresence.
 * Devcie passcode as fallback. 
 * TouchID has to be enrolled to use this method */
@interface EncapDeviceTouchIDAuthParameter : EncapAuthParameter

/* The message displayed to the user when prompted to authenticate using TouchID, for example context message sent from server.*/
@property (strong, nonnull) NSString *touchIdPrompt;

- (nonnull instancetype) initWithTouchIdPrompt:(nonnull NSString *)touchIdPrompt;

@end



/* Using kSecAccessControlBiometryCurrentSet.
 * Data is invalidated when fingers are added or removed.
 * TouchID has to be enrolled to use this method */
@interface EncapDeviceStrongTouchIDAuthParameter : EncapAuthParameter

/* The message displayed to the user when prompted to authenticate using TouchID, for example context message sent from server.*/
@property (strong, nonnull) NSString *touchIdPrompt;

- (nonnull instancetype) initWithTouchIdPrompt:(nonnull NSString *)touchIdPrompt;

@end


/* Using kSecAccessControlBiometryCurrentSet.
   When Face ID is re-enrolled this item is invalidated. */
@interface EncapDeviceFaceIDAuthParameter : EncapAuthParameter

@end


