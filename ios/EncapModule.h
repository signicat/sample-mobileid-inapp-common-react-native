
#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <EncapAPI/EncapAPI.h>

@interface EncapModule : NSObject <RCTBridgeModule, EncapPushDelegate>
@property (nonatomic, strong) EncapController *encapController;
@property (nonatomic, strong) EncapStartActivationResult *startActivationResult;
@property (nonatomic, strong) EncapStartResult *startAuthenticationResult;
@property (nonatomic, strong) EncapStartAddOrUpdateResult *startAddOrUpdateResult;
@end

