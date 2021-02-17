
#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <EncapAPI/EncapAPI.h>

#define PINCODE @"pincode"
#define TOUCH_ID @"touchId"
#define FACE_ID @"faceId"
#define BIOMETRY @"biometry"

@interface EncapModule : NSObject <RCTBridgeModule, EncapPushDelegate>
@property (nonatomic, strong) EncapController *encapController;
@property (nonatomic, strong) EncapStartActivationResult *startActivationResult;
@property (nonatomic, strong) EncapStartResult *startAuthenticationResult;
@property (nonatomic, strong) EncapStartAddOrUpdateResult *startAddOrUpdateResult;
@end

