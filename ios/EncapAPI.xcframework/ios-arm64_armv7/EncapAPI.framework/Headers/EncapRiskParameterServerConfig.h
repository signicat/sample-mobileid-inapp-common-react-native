//
//  EncapRiskParameterServerConfig.h
//  Encap
//
//  Copyright © 2018 Encap. All rights reserved.
//

#import <Foundation/Foundation.h>
@class EncapStorage;

NS_ASSUME_NONNULL_BEGIN

@interface EncapRiskParameterServerConfig : NSObject

@property (nullable) NSNumber *systemVersionEnabled;
@property (nullable) NSNumber *isRootAvailableEnabled;
@property (nullable) NSNumber *userAgentEnabled;
@property (nullable) NSNumber *locationEnabled;
@property (nullable) NSNumber *networkInterfacesEnabled;
@property (nullable) NSNumber *isSecureScreenLockEnabled;
@property (nullable) NSNumber *deviceManufacturerEnabled;
@property (nullable) NSNumber *deviceModelEnabled;
@property (nullable) NSNumber *applicationHashEnabled;

@end

NS_ASSUME_NONNULL_END
