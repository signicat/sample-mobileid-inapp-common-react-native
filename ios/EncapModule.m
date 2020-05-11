
#import "EncapModule.h"
#import "React/RCTLog.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <AVFoundation/AVFoundation.h>

@implementation EncapModule

static NSString *TAG = @"Sample InApp";

#pragma mark - init method

- (id) init {
  self = [super init];

  if (!self.encapController) {
    RCTLogInfo(@"Encap module is initialized...");
    //initialize encap controller
    self.encapController = [EncapController new];
  }

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
  EncapConfig *config = [EncapConfig sharedConfig];
  NSString *registrationId = config.registrationId;
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
    NSNumber *pinInputLength = [NSNumber numberWithUnsignedInteger:successResult.pinCodeLengthMin];
    EncapInputType pinInputType = successResult.pinCodeType;
    self.startActivationResult = successResult;
    // NOTE that FaceID and TouchIDs are not used in this sample app. The following line shows how to get their info from Encap API
    // In your production app, you should also check if your device supports these features and enabled by the user
    BOOL supportTouchID = [successResult.availableAuthMethods containsObject: [NSNumber numberWithInt:EncapAuthMethodDeviceTouchID]];
    BOOL supportStrongTouchID = [successResult.availableAuthMethods containsObject: [NSNumber numberWithInt:EncapAuthMethodDeviceStrongTouchID]];
    BOOL supportFaceID = [successResult.availableAuthMethods containsObject: [NSNumber numberWithInt:EncapAuthMethodDeviceFaceID]];
    RCTLogInfo(@"Inside startActivation, supportFingerPrint: %@", (supportTouchID||supportStrongTouchID)?@YES:@NO);
    successCallback(@[pinInputLength, [self stringFromEncapInputType:pinInputType], (supportTouchID||supportStrongTouchID)?@YES:@NO, supportFaceID?@YES:@NO]);
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
    BOOL supportTouchID = [successResult.authMethods containsObject: [NSNumber numberWithInt:EncapAuthMethodDeviceTouchID]];
    BOOL supportStrongTouchID = [successResult.authMethods containsObject: [NSNumber numberWithInt:EncapAuthMethodDeviceStrongTouchID]];
    BOOL supportPincode = [successResult.authMethods containsObject: [NSNumber numberWithInt:EncapAuthMethodDevicePIN]];
    NSString *contextTitle = successResult.contextTitle?successResult.contextTitle:@"";
    NSString *contextContent = successResult.contextContent?[self stringFromNSData:successResult.contextContent]:@"";
    successCallback(@[supportPincode?@YES:@NO, (supportTouchID||supportStrongTouchID)?@YES:@NO, contextTitle, contextContent]);

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
  EncapConfig *config = [EncapConfig sharedConfig];
  config.serverURL = url;
  config.publicKey = key;
  config.applicationId = appId;
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

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
