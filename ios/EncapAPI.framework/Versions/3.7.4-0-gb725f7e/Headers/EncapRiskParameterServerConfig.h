//
//  EncapRiskParameterServerConfig.h
//  Encap
//
//  Copyright © 2018 Encap. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EncapRiskParameterServerConfig : NSObject

@property (readonly, nullable) NSNumber *systemVersionEnabled;
@property (readonly, nullable) NSNumber *isRootAvailableEnabled;
@property (readonly, nullable) NSNumber *userAgentEnabled;
@property (readonly, nullable) NSNumber *locationEnabled;
@property (readonly, nullable) NSNumber *networkInterfacesEnabled;
@property (readonly, nullable) NSNumber *isSecureScreenLockEnabled;
@property (readonly, nullable) NSNumber *deviceManufacturerEnabled;
@property (readonly, nullable) NSNumber *deviceModelEnabled;
@property (readonly, nullable) NSNumber *applicationHashEnabled;

+ (EncapRiskParameterServerConfig *) sharedRiskConfig;

@end

NS_ASSUME_NONNULL_END
