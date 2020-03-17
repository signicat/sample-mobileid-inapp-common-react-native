/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
#import <EncapAPI/EncapPush.h>
#import "EncapModule.h"

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>

@property (strong, nonatomic) EncapModule *encapModule;
@property (strong, nonatomic) EncapPush *encapPush;
@property (nonatomic, strong) UIWindow *window;

@end
