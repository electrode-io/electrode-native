//
//  ViewController.m
//  ErnRunner
//
//  Created by Claire Weijie Li on 6/12/17.
//  Copyright © 2017 Claire Weijie Li. All rights reserved.
//

#import "ViewController.h"
#import "RunnerConfig.h"
#import <ElectrodeContainer/ElectrodeContainer.h>

@interface ViewController ()
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.

    UIViewController *viewController =
    [[ElectrodeReactNative sharedInstance] miniAppWithName:MainMiniAppName properties:nil];
    viewController.view.frame = [UIScreen mainScreen].bounds;
    [self.view addSubview:viewController.view];
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

@end
