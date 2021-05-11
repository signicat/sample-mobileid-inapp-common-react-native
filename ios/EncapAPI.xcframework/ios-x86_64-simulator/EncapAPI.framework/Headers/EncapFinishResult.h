//
//  EncapFinishResult.h
//  Encap
//
//  Copyright (c) 2013 Encap. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "EncapTypes.h"

@interface EncapFinishResult : NSObject

/**
 * Type of response that can be found in the responseContent property.
 */
@property (nonatomic, assign) EncapResponseType     responseType;

/**
 * The response data.  This data should be evaluated according
 * to its type as indicated by -responseType.
 */

@property (nonatomic, copy, nullable) NSData                *contextContent;
@property (nonatomic, copy, nullable) NSString              *contextMIME;
@property (nonatomic, copy, nullable) NSString              *contextTitle;


@end
