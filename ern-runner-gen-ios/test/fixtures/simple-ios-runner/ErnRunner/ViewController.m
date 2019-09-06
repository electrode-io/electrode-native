/*
 * Copyright 2017 WalmartLabs

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "ViewController.h"
#import "RunnerConfig.h"
#import <ElectrodeContainer/ElectrodeContainer.h>

typedef void(^Payload)(NSDictionary *_Nullable);
typedef BOOL(^NavigateWithRoute)(NSDictionary *_Nullable);

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.

    ENNavigationDelegate *delegate = [[ENNavigationDelegate alloc] init];
    [delegate viewDidLoadWithViewController:self];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/
- (NSString * _Nonnull)rootComponentName {
    return MainMiniAppName;
}

- (NSDictionary * _Nullable)properties {
    return nil;
}

- (Payload _Nullable)finish {
    return ^(NSDictionary *payload) {
        return;
    };
}

-(NavigateWithRoute _Nonnull)navigateWithRoute {
    return ^BOOL(NSDictionary * _Nullable dict) {
        return false;
    };
}

@synthesize finishedCallback;

@synthesize properties;

@synthesize rootComponentName;

@synthesize finish;

@synthesize navigateWithRoute;

@end
