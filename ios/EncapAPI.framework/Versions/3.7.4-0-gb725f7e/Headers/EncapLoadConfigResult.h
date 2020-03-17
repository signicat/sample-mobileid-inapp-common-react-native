//
//  EncapLoadConfigResult.h
//  Encap
//
//  Copyright (c) 2013 Encap. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "EncapTypes.h"

@interface EncapLoadConfigResult : NSObject

/**
 * Server side configured length of activation code.
 */
@property (nonatomic, assign) NSInteger         activationCodeLength;

/**
 * Type of activation code, used to display correct keyboard type.
 */
@property (nonatomic, assign) EncapInputType    activationCodeInputType;

@end
