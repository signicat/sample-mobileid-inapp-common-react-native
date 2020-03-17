//
//  EncapTypes.h
//  EncapAPI
//
//  Copyright (c) 2013 Encap. All rights reserved.
//

#import <UIKit/UIKit.h>


typedef NS_ENUM(NSInteger, EncapInputType) {
    EncapInputTypeAny,
    EncapInputTypeNumeric,
    EncapInputTypeAlpha,
    EncapInputTypeAlphaNumeric,
};

UIKeyboardType UIKeyboardTypeFromEncapInputType(EncapInputType inputType);
BOOL IsValidForEncapInputType(EncapInputType inputType, NSString *string);

typedef NS_ENUM(NSInteger, EncapResponseType) {
    /**
     * ResponseContent is empty.
     */
    EncapResponseTypeNone = -1,
    
    
    /**
     * Message/data that can be displayed to the user.
     *
     * When response type is message, 4 normal scenarios for context:
     * 1. contentContext, contentMIME and contentTitle are all nil.
     * 2. contentContext and contentMIME have values, and contextTitle is nil.
     * 3. contentContext, contentMIME and contentTitle all have values.
     * 4. Only contentTitle has value.
     *
     */
    EncapResponseTypeMessage = 0,
    
    /**
     * OTP is unsupported from 3.0.
     * EncapResponseTypeOTP = 1,
     */
    
    /**
     * SAML Assertion
     */
    EncapResponseTypeAssertion = 3,
};

typedef NS_ENUM(NSInteger, EncapAuthMethod) {
    EncapAuthMethodUnknown,
    EncapAuthMethodDevice,
    EncapAuthMethodDevicePIN,
    EncapAuthMethodDeviceTouchID,
    EncapAuthMethodDeviceStrongTouchID,
    EncapAuthMethodDeviceFaceID
};

typedef NS_ENUM(NSInteger, EncapPurpose) {
    EncapPurposeActivation,
    EncapPurposeAuthentication,
    EncapPurposeSigning,
};

typedef NS_ENUM(NSInteger, EncapRiskParameter) {
    EncapRiskParameterJailbreakDetected /** IsRootAvailable sent to SP **/
};
