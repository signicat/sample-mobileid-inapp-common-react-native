//
//  EncapController.h
//  EncapAPI
//
//  Copyright (c) 2013 Encap. All rights reserved.
//

#import <Foundation/Foundation.h>

#import "EncapLoadConfigResult.h"
#import "EncapStartActivationResult.h"
#import "EncapFinishActivationResult.h"
#import "EncapStartAuthenticationResult.h"
#import "EncapStartAddOrUpdateResult.h"
#import "EncapStartSigningResult.h"
#import "EncapStartAuthenticationOrSigningResult.h"
#import "EncapFinishAuthenticationResult.h"
#import "EncapFinishAddOrUpdateResult.h"
#import "EncapFinishSigningResult.h"
#import "EncapErrorResult.h"
#import "EncapAuthParameter.h"

/**
 * This is a state machine that handles all operations with the Encap server.
 *
 * An instance of this class should handle only one operation at a time, since it maintains state for it.
 *
 * To activate:
 * - Invoke loadConfigOnSuccess:onError (optional, not needed for client only mode):
 * - When the onSuccess triggers, configuration has successfully been retrieved from server.
 * - Start activation by asking for the activation code when not performing a client-only activation.
 * - Invoke -startActivationWithCode:onSuccess:onError
 * - On successful verification, complete activation with desired authenticationMethod.
 * - Invoke -finishActivationWithActivationParameters:parameters:onSuccess:onError:
 * - If successful, show the responseContent to the user.
 *
 * To authenticate:
 * - Invoke startAuthenticationClientOnly:onSuccess:onError
 * - When onSuccess triggers, ask user for desired authentication method.
 * - Invoke finishAuthenticationWithAuthParameter:onSuccess:onError:
 * - if successful, show the responseContent to the user.
 *
 * To sign:
 * - Invoke startSigningOnSuccess:onError
 * - When onSuccess triggers, show the user the document contained in contextContent.
 * - Ask the user whether he agrees with the document's terms.
 * - If he does, complete signing with desired authentication method, if not cancel the session.
 * - Invoke finishSigningWithAuthParameter:onSuccess:onError:
 * - If successful, show the responseContent to the user.
 *
 */

@interface EncapController : NSObject

/**
 * Returns a shared instance of EncapController
 */
+ (EncapController * _Nonnull) sharedController;

/**
 * ID received over a push-channel. Required for activation and authentication requests if platform.pushValidation 
 * is set to TRUE on server.
 */
@property (copy, nullable) NSNumber                          *pushSessionId;

/**
 * Check whether this controller instance is currently communicating with the Encap server to handle an operation.
 * @return TRUE if operation in progress, otherwise FALSE.
 */
@property (assign, readonly) BOOL  isOperationInProgress;

/**
 * Checks if activation data is present on the device.
 * It will not perform a check against Encap Server to check status of current activation.
 * @return TRUE if activated, otherwise FALSE.
 */
@property (assign, readonly) BOOL isActivated;

/**
 * Checks if activation data is present on the device and returns activated authentication methods.
 * It will not perform a check against Encap Server to check status of current activation.
 * @return activated authentication methods, nil if not activated.
 */
@property (copy, readonly, nullable) NSSet<NSNumber *> *activatedAuthenticationMethods;

/**
 * Deactivate an authentication method
 *
 * @param authMethod auth method to be deactivated
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if operation fails.
 */
- (void) deactivateAuthMethod:(EncapAuthMethod)authMethod
                    onSuccess:(nullable void (^)(void))onSuccess
                      onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;

/**
 * Deactivate the registration. This causes any information on the device registration to be removed from the client and Encap server. The client will need to reactivate before continuing to use Encap.
 *
 * @param if true, only remove registration data on device. If false, a device authentication will be performed and registration will 
 * be removed on encap server, if device authentication is successful local registration data will be 
 * removed as well, if device authentication fails an error is returned (local registration data not removed).
 * Discussion: onlyLocally is available to cover situations where the device authentication against Encap server
 * fails and app developer/user still wants to wipe registration locally. Example: Device has no internet
 * connection, first call (with onlyLocally = false) fails, app can now choose to call deactivate with
 * onlyLocally = true directly or prompt user for input (try another time, wipe locally, cancel).
 *
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if operation fails.
 */
- (void) deactivateOnlyLocally:(BOOL)onlyLocally
                     onSuccess:(nullable void (^)(void))onSuccess
                       onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;


/** 
 * Get server configuration parameters before start of activation, this call is optional and not needed in client only mode.
 *
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if operation fails.
 */
- (void) loadConfigOnSuccess:(nullable void (^)(EncapLoadConfigResult * _Nonnull successResult))onSuccess
                     onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;


/**
 * Start activation by creating an activation session with the activation code.
 *
 * @param activationCode The application session's activation code shown to the user via the application. This can be nil when doing client-only activation, if enabled on the server.
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if operation fails.
 */
- (void) startActivationWithCode:(nullable NSString *)activationCode
                       onSuccess:(nullable void (^)(EncapStartActivationResult * _Nonnull successResult))onSuccess
                         onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;

/**
 * Activate the user from the earlier created registration session.
 *
 * @param parameters The Authentication method to activate. EncapAuthMethodDevice is always activated.
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if activation fails.
 */
- (void) finishActivationWithParameters:(nonnull EncapActivationParameters*)parameters
                              onSuccess:(nullable void (^)(EncapFinishActivationResult * _Nonnull successResult))onSuccess
                                onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;

/**
 * Initiating adding (activating) of a new, or update activated authentication method.
 *
 * @param clientData Base64 encoded client data to be returned as a SAML attribute, or nil if no client data.
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if operation fails.
 */
- (void) startAddOrUpdateOfAuthMethodWithClientData:(nullable NSData *)clientData
                                          onSuccess:(nullable void (^)(EncapStartAddOrUpdateResult * _Nonnull successResult))onSuccess
                                            onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;

/**
 * Complete activation or update of auth method from the earlier created session (StartAddOrUpdate).
 *
 * @param parameters The Authentication method to activate or update. EncapAuthMethodDevice is always activated and can´t be updated.
 * @param pinParameter Existing authentication method to authorize adding the new authenticaion method.
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if activation fails.
 */
- (void) finishAddOrUpdateOfAuthMethodWithParameters:(nonnull EncapActivationParameters *)activationParameters
                                        pinParameter:(nonnull EncapDevicePinAuthParameter *)pinParameter
                                           onSuccess:(nullable void (^)(EncapFinishAddOrUpdateResult * _Nonnull successResult))onSuccess
                                             onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;

/**activationParameters
 * Create a new authentication session by identifying ourselves.
 *
 * @param authenticateForClient Whether the authentication should be used by the client only (YES) or used to authenticate an (existing) application session (NO).
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if activation fails.
 */
- (void) startAuthenticationClientOnly:(BOOL)authenticateForClient
                             onSuccess:(nullable void (^)(EncapStartAuthenticationResult *  _Nonnull successResult))onSuccess
                               onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;


/**
 * Create a new authentication session by identifying ourselves.
 *
 * @param authenticateForClient Whether the authentication should be used by the client only (YES) or used to authenticate an (existing) application session (NO).
 * @param clientData Base64 encoded client data to be returned as a SAML attribute, or nil if no client data.
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if activation fails.
 */
- (void) startAuthenticationClientOnly:(BOOL)authenticateForClient
                            clientData:(nullable NSString *)clientData
                             onSuccess:(nullable void (^)(EncapStartAuthenticationResult * _Nonnull successResult))onSuccess
                               onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;


/**
 * Authenticate the user on the earlier created authentication session.
 *
 * @param parameters The parameters used for this authentication.
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if authentication fails.
 */
- (void) finishAuthenticationWithAuthParameter:(nonnull EncapAuthParameter *)parameter
                                     onSuccess:(nullable void (^)(EncapFinishAuthenticationResult * _Nonnull successResult))onSuccess
                                       onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;


/**
 * Create a new signing session by identifying ourselves.
 *
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if authentication fails.
 */
- (void) startSigningOnSuccess:(nonnull void (^)(EncapStartSigningResult * _Nonnull successResult))onSuccess
                       onError:(nonnull void (^)(EncapErrorResult * _Nonnull errorResult))onError;


/**
 * Create a new signing session by identifying ourselves.
 *
 * @param clientData Base64 encoded client data to be returned as a SAML attribute, or nil if no client data.
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if authentication fails.
 */
- (void) startSigningWithClientData:(nullable NSString *)clientData
                          onSuccess:(nullable void (^)(EncapStartSigningResult * _Nonnull successResult))onSuccess
                            onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;


/**
 * Sign the document received earlier in the signing session.
 *
 * @param parameters Authentication parameters used for signing.
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if signing fails.
 */
- (void) finishSigningWithAuthParameter:(nonnull EncapAuthParameter*)parameter
                              onSuccess:(nullable void (^)(EncapFinishSigningResult * _Nonnull successResult))onSuccess
                                onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;

/**
 * Create a new authentication or signing session depending on current session on server.
 * This method can be used instead of calling startSigning or startAuthentication explicitly
 *
 * @param authenticateForClient Whether the authentication should be used by the client only (YES) or used to authenticate an (existing) application session (NO).
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if signing fails.
 */
- (void) startAuthenticationOrSigningClientOnly:(BOOL)authenticateForClient
                                      onSuccess:(nullable void (^)(EncapStartAuthenticationOrSigningResult * _Nonnull successResult))onSuccess
                                        onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;


/**
 * Create a new authentication or signing session depending on current session on server.
 * This method can be used instead of calling startSigning or startAuthentication explicitly
 *
 * @param authenticateForClient Whether the authentication should be used by the client only (YES) or used to authenticate an (existing) application session (NO).
 * @param clientData Base64 encoded client data to be returned as a SAML attribute, or nil if no client data.
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if signing fails.
 */
- (void) startAuthenticationOrSigningClientOnly:(BOOL)authenticateForClient
                                     clientData:(nullable NSString *)clientData
                                      onSuccess:(nullable void (^)(EncapStartAuthenticationOrSigningResult * _Nonnull successResult))onSuccess
                                        onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;


/** 
 * Cancel current activation, authentication or signing session on server.
 *
 * @param onSuccess The block that gets executed on successful operation.
 * @param onError The block that gets executed if signing fails.
 */
- (void) cancelSessionOnSuccess:(nullable void (^)(void))onSuccess
                        onError:(nullable void (^)(EncapErrorResult * _Nonnull errorResult))onError;


/**
 * Set value for a risk parameter.
 * If not set, the risk parameter won't be forwarded to Encap server.
 * The value will persist (and forwarded to server) during the lifetime of the same EncapController instance.
 * (Use sharedController method to avoid the need for setting the value again)
 *
 **/
- (void) setRiskParameter:(EncapRiskParameter)riskParameter
                withValue:(BOOL)value;

@end
