
#import "EncapModule.h"
#import "React/RCTLog.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <AVFoundation/AVFoundation.h>

@implementation EncapModule

static NSString *TAG = @"Sample InApp";

#pragma mark - init method

- (id) init {
  self = [super init];

  RCTLogInfo(@"Encap module is initialized...");
  /// Initialize Encap Controller.
  /// If the application only support one registration,
  /// `sharedController` can be used.
  self.encapController = [EncapController sharedController];

  return self;
}

- (void)activateWithPushSessionId:(NSNumber *)pushSessionId launching:(BOOL)launching {

}

- (void)authenticateWithPushSessionId:(NSNumber *)pushSessionId launching:(BOOL)launching {

}

- (void)signWithPushSessionId:(NSNumber *)pushSessionId launching:(BOOL)launching {

}

// export module with default name EncapModule
RCT_EXPORT_MODULE();

//------------- bridge methods --------------//

RCT_REMAP_METHOD(configureEncap,
                 serverUrl:(NSString *)url
                 applicationId:(NSString *)appId
                 publicKey:(NSString *)key
                 configureEncapResolver:(RCTPromiseResolveBlock)resolve
                 configureEncapRejecter:(RCTPromiseRejectBlock)reject) {
  @try {
    RCTLogInfo(@"configureEncap...1");
    [self updateEncapConfig:url publicKey:key applicationId:appId];
    RCTLogInfo(@"configureEncap...2");
    resolve(@YES);
  }
  @catch (NSException *exception) {
    reject(TAG, @"Something else went wrong while applying Encap configurations", nil);
  }
}

RCT_REMAP_METHOD(isDeviceActivated, isActivatedResolver:(RCTPromiseResolveBlock)resolve isActivatedRejecter:(RCTPromiseRejectBlock)reject){
  RCTLogInfo(@"isDeviceActivated");
  BOOL activated =  [self.encapController isActivated];
  if (activated || !activated) {
    resolve(activated ? @YES:@NO);
  } else {
    reject(TAG, @"EncapModule is not activated or something else went wrong!", nil);
  }
}

RCT_EXPORT_METHOD(cancelSession: (RCTResponseSenderBlock)successCallback callback:(RCTResponseSenderBlock)errorCallback) {
  [self.encapController cancelSessionOnSuccess:^{
    successCallback(@[[NSNull null]]);
  } onError:^(EncapErrorResult *errorResult) {
    [self handleError:errorResult inState:@"cancelSession" callback:errorCallback];
  }];
}

RCT_REMAP_METHOD(getRegistrationId, getRegistrationIdResolver:(RCTPromiseResolveBlock)resolve getRegistrationIdRejecter:(RCTPromiseRejectBlock)reject){
  NSString *registrationId = [self.encapController registrationId];
  NSLog(@"Inside getRegistrationId, registrationId = %@", registrationId);

  if([registrationId isEqual:[NSNull null]]) {
    reject(@"getRegistrationId_error", @"Error getRegistrationId. Null value", nil);
  }
  else {
    resolve(registrationId);
  }
}

RCT_EXPORT_METHOD(startActivation:(NSString *)activationCode callback:(RCTResponseSenderBlock)successCallback callback:(RCTResponseSenderBlock)errorCallback) {
  RCTLogInfo(@"Inside startActivation with activationCode %@", activationCode);
  [self.encapController startActivationWithCode:activationCode onSuccess:^(EncapStartActivationResult *successResult) {
    self.startActivationResult = successResult;
    NSNumber *pinInputLength = [NSNumber numberWithUnsignedInteger:successResult.pinCodeLengthMin];
    EncapInputType pinInputType = successResult.pinCodeType;
    
    // Check if any biometric method is allowed to be used
    BOOL isBiometryAuthMethodEnabled = [[LAContext alloc] canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:nil];
    
    NSDictionary *supportedAuthMethods = [self getAllowedAuthMethods:successResult.availableAuthMethods isBiometryAuthMethodEnabled:isBiometryAuthMethodEnabled];
    
    successCallback(@[pinInputLength, [self stringFromEncapInputType:pinInputType], supportedAuthMethods]);
  } onError:^(EncapErrorResult *errorResult) {
    [self handleError:errorResult inState:@"startActivation" callback:errorCallback];
  }];
}

RCT_EXPORT_METHOD(finishPinCodeActivation:(NSString *)pinCode callback:(RCTResponseSenderBlock)successCallback callback:(RCTResponseSenderBlock)errorCallback) {
  RCTLogInfo(@"Inside finishPinCodeActivation with pinCode %@", pinCode);
  EncapAuthParameter *authParam = [[EncapDevicePinAuthParameter alloc] initWithPinCode:pinCode];
  EncapActivationParameters *activationParameters = [[EncapActivationParameters alloc] initWithAuthParameter:authParam];
  [self.encapController finishActivationWithParameters:activationParameters onSuccess:^(EncapFinishActivationResult *successResult) {
    successCallback(@[[successResult description]]);
  } onError:^(EncapErrorResult *errorResult) {
    [self handleError:errorResult inState:@"finishPinCodeActivation" callback:errorCallback];
  }];
}

RCT_REMAP_METHOD(deactivate, deactivateResolver:(RCTPromiseResolveBlock)resolve deactivateRejecter:(RCTPromiseRejectBlock)reject){
  RCTLogInfo(@"Inside deactivate");
  [self.encapController deactivateOnlyLocally:@NO onSuccess:^{
    resolve(@YES);
  } onError:^(EncapErrorResult *errorResult) {
    reject(TAG, @"Error deactivating the device", nil);
  }];
}

RCT_EXPORT_METHOD(startAuthentication: (RCTResponseSenderBlock)successCallback callback:(RCTResponseSenderBlock)errorCallback) {
  NSLog(@"Inside startAuthentication");
  // when application is being used to authenticate the user for a web site, pass NO to startAuthenticationClientOnly
  [self.encapController startAuthenticationClientOnly:(NO) onSuccess:^(EncapStartAuthenticationResult * _Nonnull successResult) {
    NSLog(@"Success startAuthentication");
    self.startAuthenticationResult = successResult;
    // NOTE: *authMethods* check for which biometry is allowed in the device (Not against what is actually enrolled),
    //       by example: If the user enable faceID / TouchID as authentication method in MobileID then the user block it in the App settings
    //       the *successResult* will contains FALSE for EncapAuthMethodDeviceFaceID or EncapAuthMethodDeviceStrongTouchID
    BOOL supportPincode = [successResult.authMethods containsObject:[NSNumber numberWithInt:EncapAuthMethodDevicePIN]];
    BOOL supportTouchId = [successResult.authMethods containsObject:[NSNumber numberWithInt:EncapAuthMethodDeviceStrongTouchID]];
    BOOL supportFaceId = [successResult.authMethods containsObject:[NSNumber numberWithInt:EncapAuthMethodDeviceFaceID]];

    NSString *contextTitle = successResult.contextTitle?successResult.contextTitle:@"";
    NSString *contextContent = successResult.contextContent?[self stringFromNSData:successResult.contextContent]:@"";

    successCallback(@[
      @{
        PINCODE: supportPincode ? @YES : @NO,
        TOUCH_ID: supportTouchId ? @YES : @NO,
        FACE_ID: supportFaceId ? @YES : @NO,
        BIOMETRY: (supportTouchId || supportFaceId) ? @YES : @NO,
      },
      contextTitle,
      contextContent
    ]);
  } onError:^(EncapErrorResult * _Nonnull errorResult) {
    NSLog(@"Fail startAuthentication");
    [self handleError:errorResult inState:@"startAuthentication" callback:errorCallback];
  }];
}

RCT_EXPORT_METHOD(finishPinCodeAuthentication:(NSString *)pinCode callback:(RCTResponseSenderBlock)successCallback callback:(RCTResponseSenderBlock)errorCallback) {
  EncapAuthParameter *authParam = [[EncapDevicePinAuthParameter alloc] initWithPinCode:pinCode];
  [self.encapController finishAuthenticationWithAuthParameter:authParam onSuccess:^(EncapFinishAuthenticationResult * _Nonnull successResult) {
    successCallback(@[[successResult description]]);
  } onError:^(EncapErrorResult * _Nonnull errorResult) {
    [self handleError:errorResult inState:@"finishPinCodeAuthentication" callback:errorCallback];
  }];
}


//------------- local utility methods --------------//

- (void) updateEncapConfig: (NSString *)url publicKey:(NSString *)key applicationId:(NSString *) appId {
  RCTLogInfo(@"Updating Encap Config...");
  EncapConfig *config = [[EncapConfig alloc] init];
  config.serverURL = url;
  config.publicKey = key;
  config.applicationId = appId;
  [self.encapController setConfig:config];
}

- (NSString*) stringFromEncapInputType:(EncapInputType) encapInputType {
  NSString *result = nil;
  switch(encapInputType) {
    case EncapInputTypeNumeric:
      result = @"Numeric";
      break;
    case EncapInputTypeAlpha:
      result = @"Alphabetical";
      break;
    case EncapInputTypeAlphaNumeric:
      result = @"AlphaNumeric";
      break;
    case EncapInputTypeAny:
    default:
      result = @"Any";
      break;
  }
  return result;
}

- (void) handleError:(EncapErrorResult *)error inState:(NSString *)apiState callback:(RCTResponseSenderBlock)errorCallback {
  NSString *message = [self getEncapLocalizationKeyForError:error];
  // invoke callback
  switch ((EncapError)error.errorCode) {
    case EncapServerErrorAuthenticationFailed:
      errorCallback(@[message, [NSNumber numberWithLong:(long)error.remainingAttempts]]);
      break;
    default:
      errorCallback(@[message]);
      break;
  }
}

- (NSString *) getEncapLocalizationKeyForError:  (EncapErrorResult *) error {
  NSString *localizedErrorKey = EncapLocalizationKeyForError((EncapError)error.errorCode);
  RCTLogInfo(@"Inside getMessageFromErrorCode: %@", localizedErrorKey);
  return localizedErrorKey;
}

- (NSString *) stringFromNSData:(NSData*) nsData {
  char lastByte;
  [nsData getBytes:&lastByte range:NSMakeRange([nsData length]-1, 1)];
  if (lastByte == 0x0) {
    // string is null terminated
    return [NSString stringWithUTF8String:[nsData bytes]];
  } else {
    // string is not null terminated
    return [[NSString alloc] initWithData:nsData encoding:NSUTF8StringEncoding];
  }
}

-(NSDictionary*)getAllowedAuthMethods:(NSSet *)allowedEncapAuthMethods isBiometryAuthMethodEnabled: (BOOL)biometryEnabled {
  BOOL isPincodeAllowed = [allowedEncapAuthMethods containsObject: [NSNumber numberWithInt:EncapAuthMethodDevicePIN]];
  
  // NOTE: Actually *allowedEncapAuthMethods* will contains the allowed methods based on what actually the
  // device supports; it means by example if the user disables the biometric in the iOS app settings ENCAP
  // will return false even though they have configured in the server that supports any authentication method.
  // Encap will do an *AND* operation between what is actually configured in the server versus what it
  // actually supports.
  BOOL isTouchIdAvailableAuthMethod = [allowedEncapAuthMethods containsObject: [NSNumber numberWithInt:EncapAuthMethodDeviceStrongTouchID]];
  BOOL serverSupportTouchIdUnknown = biometryEnabled == false && isTouchIdAvailableAuthMethod == false;
  BOOL serverSupportTouchId = biometryEnabled && isTouchIdAvailableAuthMethod;
  NSString *touchIdAllowed = serverSupportTouchIdUnknown ? @"unknown" : (serverSupportTouchId ? @"true" : @"false");
  
  BOOL isFaceIdAvailableAuthMethod = [allowedEncapAuthMethods containsObject: [NSNumber numberWithInt:EncapAuthMethodDeviceFaceID]];
  BOOL serverSupportFaceIdUnknown = biometryEnabled == false && isFaceIdAvailableAuthMethod == false;
  BOOL serverSupportFaceId = biometryEnabled && isFaceIdAvailableAuthMethod;
  NSString *faceIdAllowed = serverSupportFaceIdUnknown ? @"unknown" : (serverSupportFaceId ? @"true" : @"false");
  
  return @{
    PINCODE: isPincodeAllowed ? @"true" : @"false",
    TOUCH_ID: touchIdAllowed,
    FACE_ID: faceIdAllowed
  };
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
