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

/**
 * Indicate if the error is recoverable or final in a finish operation.
 * @return TRUE if the error is recoverable, otherwise FALSE.
 */
@property (nonatomic, assign) BOOL      isRecoverableError;

/**
 * Convert a NSError produced by EncapAPI to an EncapErrorResult
 * If  a NSError is provided that does not originate from EncapAPI, nil will be returned.
 *
 *@param error NSError returned EncapAPI (ex  isActivatedLocallyWithError: in EncapController)
 *@return EncapErrorResult or nil if nil is passed as an argument or if NSError doesn't originate from EncapAPI
 */
- (instancetype _Nullable) initWithNSError:(NSError * _Nullable)error;

@end
