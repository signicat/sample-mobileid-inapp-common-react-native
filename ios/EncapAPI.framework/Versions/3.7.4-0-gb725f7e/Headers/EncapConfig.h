//
//  EncapConfig.h
//  Encap
//
//  Copyright (c) 2013 Encap. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreLocation/CoreLocation.h>
#import "EncapRiskParameterServerConfig.h"

@interface EncapConfig : NSObject

#pragma mark - Configurable 

/** URL to Encap Server */
@property (readwrite, copy, nullable) NSString       *serverURL;

/** Signing key length - default is 2048 */
@property (readwrite) NSUInteger                     signingKeyLength;

/** Signing enabled - default is FALSE */
@property (readwrite) BOOL                           signingEnabled;

/** Identifies the client application in case the
 *  service provider has multiple applications that
 *  authenticate with the same Encap server. */
@property (readwrite, copy, nonnull) NSString        *applicationId;

/** Seconds before connection to Encap server times out - default is 20 */
@property (readwrite) NSTimeInterval                 connectionTimeOut;

/** Public key of Encap server for end-to-end encrypted communication
 *  base64 der encoded */
@property (readwrite, copy, nullable) NSString       *publicKey;

/** Hashes of public keys in the certificate chain sent from server to trust.
 *  Format: <hash algorithm>/<base64-encoded public key hash>
 *  ex:     "sha256/bb7e6ac30e7ad462e222bc342e498f6c5ec41af6ea0eedfc61e410dabfe16c1e"
 *  Public key pinning is disabled when not set */
@property (readwrite, copy, nullable) NSArray<NSString *>    *publicKeyHashes;

/**
 * Configure the location accuracy.
 * Defaults to kCLLocationAccuracyHundredMeters.
 */
@property (readwrite) CLLocationAccuracy             locationAccuracy;

#pragma mark - Read Only

/** Version of Encap API. */
@property (readonly, copy, nonnull) NSString         *encapAPIVersion;

/** Unique Identifier for device, UUID stored in keychain */
@property (readonly, copy, nonnull) NSString         *uniqueIdentifier;

/** Registration id */
@property (readonly, copy, nullable) NSString        *registrationId;

/** Enabled Risk parameters in server config. The values will be available after a successful startActivation operation, and updated after a successful startActivation or startAuthentication operation if configuration of these values has changed */
@property (readonly, nonnull) EncapRiskParameterServerConfig    *riskparamConfig;

/**
 * Returns the singleton config instance.
 */
+ ( EncapConfig * _Nonnull ) sharedConfig;


@end
