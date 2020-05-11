//
//  EncapStartAddOrUpdateResult.h
//  Encap
//
//  Copyright © 2016 Encap. All rights reserved.
//

#import "EncapTypes.h"

@interface EncapStartAddOrUpdateResult : NSObject

/**
 * The date indicating the last time somebody attempted to
 * authenticate himself using this registrationId.
 */
@property (nonatomic, copy, nullable) NSDate *lastAttempt;

/**
 * The total amount of invalid authentication attempts permitted for EncapAuthMethodDevicePIN
 * by the server before locking the account down to prevent brute-force entry.
 */
@property (nonatomic, assign) NSInteger totalAttemptsPIN;

/**
 * The amount of remaining invalid authentication attempts for EncapAuthMethodDevicePIN the
 * user has left before his account will be locked down by the server.
 */
@property (nonatomic, assign) NSInteger remainingAttemptsPIN;


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
 * Allowed authentication methods to add or update.
 */
@property (nonatomic, copy, nonnull) NSSet *allowedAuthMethodsToActivate;

@end
