//
//  EncapStartResult.h
//  Encap
//
//  Copyright (c) 2013 Encap. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "EncapTypes.h"

@interface EncapStartResult : NSObject

/**
 * The purpose of this authentication session. This should be
 * used by the user interface to determine which flow to show the user.
 */
@property (nonatomic, assign) EncapPurpose purpose;

/**
 * The date indicating the last time somebody attempted to
 * authenticate himself using this registrationId.
 */
@property (nonatomic, copy, nullable) NSDate *lastAttempt;

/**
 * The total amount of invalid authentication attempts for EncapAuthMethodDevicePIN permitted
 * by the server before locking the account down to prevent brute-force entry.
 */
@property (nonatomic, assign) NSInteger totalAttemptsPIN;

/**
 * The amount of remaining invalid authentication attempts for EncapAuthMethodDevicePIN the
 * user has left before his account will be locked down by the server.
 */
@property (nonatomic, assign) NSInteger remainingAttemptsPIN;

/**
 * The title is a short description of the authentication or signing context.
 */
@property (nonatomic, copy, nullable) NSString *contextTitle;

/**
 * The authentication context describes to the user why he
 * should authenticate himself or what the user should sign.
 */
@property (nonatomic, copy, nullable) NSData  *contextContent;

/**
 * Determines the format of the authentication or signing context content data.
 * Use this to determine how to decode and present the content to users.
 */
@property (nonatomic, copy, nullable) NSString *contextMIME;

/**
 * The data that needs to be signed during a signature operation.
 */
@property (nonatomic, copy, nullable) NSData *digestInfo;

/**
 * Server side configured min length of PIN
 */
@property (nonatomic, assign) NSUInteger pinCodeLengthMin;

/**
 * Server side configured max length of PIN
 */
@property (nonatomic, assign) NSUInteger pinCodeLengthMax;

/**
 * Type of PIN code, used to display correct keyboard type.
 */
@property (nonatomic, assign) EncapInputType pinCodeType;

/**
 * Allowed authentication methods.
 */
@property (nonatomic, copy, nonnull) NSSet *authMethods;


@end
