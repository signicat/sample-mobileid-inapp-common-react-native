//
//  EncapErrorResult.h
//  Encap
//
//  Copyright (c) 2013 Encap. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "EncapErrors.h"

@interface EncapErrorResult : NSObject

/**
 * Encap error Code
 */
@property (nonatomic, assign) EncapError    errorCode;

/**
 * Technical description of error.
 */
@property (nonatomic, copy, nullable) NSString      *technicalDescription;

/**
 * If available, the underlying error that caused the error.
 */
@property (nonatomic, copy, nullable) NSError       *underlyingError;

/**
 * Remaing attempts for current authMethod before registration will be locked.
 * Only set for authentication Errors, otherwise nil.
 */
@property (nonatomic, assign) NSInteger     remainingAttempts;

@end
