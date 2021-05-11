//
//  EncapStartActivationResult.h
//  Encap
//
//  Copyright (c) 2013 Encap. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "EncapTypes.h"

@interface EncapStartActivationResult : NSObject

/**
 * ID of activation
 */
@property (nonatomic, copy, nullable) NSString          *registrationId;

/**
 * Server side configured min length of PIN
 */
@property (nonatomic, assign) NSUInteger        pinCodeLengthMin;

/**
 * Server side configured max length of PIN
 */
@property (nonatomic, assign) NSUInteger        pinCodeLengthMax;

/**
 * Type of PIN code, used to display correct keyboard type.
 */
@property (nonatomic, assign) EncapInputType    pinCodeType;

/**
 * Allowed and available authentication methods to activate.
 */
@property (nonatomic, copy, nullable) NSSet     *availableAuthMethods;

/**
 * Raw list of authentication methods that is configured on the server
 */
@property (nonatomic, copy, nullable) NSSet<NSString*>     *serverConfiguredAuthMethods;


@end
