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

#import "ERNDevSettingsViewController.h"
#import "ElectrodeBundle.h"

static NSString *packagerIPPort = @"bundleStoreHostPort";
static NSString *bundleStore = @"bundleStore";
static NSString *storeBundleId = @"storeBundleId";
static NSString *autoReloadBundle = @"autoReloadBundle";
static NSString *enableBundleStore = @"enableBundleStore";
static NSString *latestBundle = @"latestBundle";

@interface ERNDevSettingsViewController ()

@end

static dispatch_semaphore_t semaphore;

@implementation ERNDevSettingsViewController {
UITableView *_tableView;
UITableViewStyle tableViewStyle;
UISwitch *_bundleStoreSwitch;
UISwitch *_reloadBundleSwitch;
BOOL isAvailable;
UIActivityIndicatorView *_activityView;
// by default selectedStore will be NONE
__block NSString *selectedStore;
__block NSString *bundleId;
__block NSString *packagerIPandPort;
__block BOOL clearBundleId;
    NSArray *titleForHeaders;
    // array to store the responseß (bundleIdObjects)
    __block NSArray *ernBundleObjects;
    // array to store the epoch time. epoch time will be converted to date and time
    __block NSMutableArray *dateAndTime;
    __block NSMutableArray <ElectrodeBundle *> *bundleArray;
}

- (id)initWithStyle:(UITableViewStyle)style {
    self = [super initWithStyle:style];
    if (self) {
        // Custom initialization
        self.title = @"Electrode Native Settings";
        tableViewStyle = style;
    }
    return self;
}


- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
    selectedStore = @"None";
    bundleId = nil;
    _tableView = [[UITableView alloc] initWithFrame:self.view.bounds style:tableViewStyle];
    _tableView.delegate = self;
    _tableView.dataSource = self;
    // add to canvas
    [self.view addSubview:_tableView];
    [self createBarButtonItems];
    // enableBundleStore OFF by default.
    isAvailable = [[NSUserDefaults standardUserDefaults] boolForKey:enableBundleStore];
    _activityView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleGray];
    _activityView.center = self.view.center;
    [self.view addSubview:_activityView];
    clearBundleId = NO;
    //default value
    if ([[NSUserDefaults standardUserDefaults] objectForKey:packagerIPPort] == nil) {
        self->packagerIPandPort = @"localhost:8080";
        [[NSUserDefaults standardUserDefaults] setObject:self->packagerIPandPort forKey:packagerIPPort];
    }
    // Store titleHeaders in an Array
    titleForHeaders = @[@"Bundle Store", @"Server host and Port", @"Store", @"Bundle ID", @"Auto reload"];
    // create a semaphore
   semaphore = dispatch_semaphore_create(0);
}

- (void)createBarButtonItems {
    UIBarButtonItem *cancelButton = [[UIBarButtonItem alloc]
                                     initWithTitle:@"Cancel"
                                     style:UIBarButtonItemStylePlain
                                     target:self
                                     action:@selector(cancelButtonAction)];
    self.navigationItem.leftBarButtonItem = cancelButton;
    UIBarButtonItem *doneButton = [[UIBarButtonItem alloc]
                                   initWithTitle:@"Done"
                                   style:UIBarButtonItemStylePlain
                                   target:self
                                   action:@selector(cancelButtonAction)];
    self.navigationItem.rightBarButtonItem = doneButton;
}

- (void)cancelButtonAction {
    [self dismissViewControllerAnimated:YES completion:nil];
}

- (void)bundleStoreSwitchAction:(UISwitch *)sender {
    NSIndexPath *indexPath = [_tableView indexPathForRowAtPoint:[sender convertPoint:CGPointZero toView:_tableView]];
    UITableViewCell *cell = [_tableView cellForRowAtIndexPath:indexPath];
    cell.textLabel.text = sender.on ? @"Disable" : @"Enable";
    [[NSUserDefaults standardUserDefaults] setBool:sender.on forKey:enableBundleStore];
    isAvailable = sender.on;
    [self reloadTableView];
    if ([self.delegate respondsToSelector:@selector(reloadBundle)]) {
        [self.delegate reloadBundle];
    }
}

- (void)reloadBundleSwitch:(UISwitch *)sender {
    [[NSUserDefaults standardUserDefaults] setBool:sender.isOn forKey:autoReloadBundle];
    [self reloadTableView];
}

#pragma mark - UITableViewDataSource
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    return [titleForHeaders count];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return 1;
}

- (UITableViewCell *)tableView:(UITableView *)theTableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    static NSString *cellIdentifier = @"Cell";
    UITableViewCell *cell = (UITableViewCell *)[theTableView dequeueReusableCellWithIdentifier:cellIdentifier];
    if (cell == nil) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:cellIdentifier];
    }
    switch (indexPath.section) {
        case 0:
            _bundleStoreSwitch = [[UISwitch alloc] initWithFrame:CGRectZero];
            [_bundleStoreSwitch addTarget:self action:@selector(bundleStoreSwitchAction:) forControlEvents:UIControlEventValueChanged];
            cell.accessoryView = _bundleStoreSwitch;
            cell.textLabel.text = isAvailable ? @"Disable" : @"Enable";
            [_bundleStoreSwitch setOn:isAvailable animated:NO];
            break;
        case 1:
            cell.textLabel.text = [[NSUserDefaults standardUserDefaults] objectForKey:packagerIPPort];
            break;
        case 2:
            if ([[NSUserDefaults standardUserDefaults] objectForKey:bundleStore] != nil) {
                cell.textLabel.text = [[NSUserDefaults standardUserDefaults] objectForKey:bundleStore];
            }
            else {
                cell.selectionStyle = UITableViewCellSelectionStyleNone;
                cell.textLabel.text = nil;
            }
            break;
        case 3:
            if ([[NSUserDefaults standardUserDefaults] objectForKey:storeBundleId] != nil) {
                if ([[NSUserDefaults standardUserDefaults] boolForKey:@"latestBundle"]) {
                    self->bundleId = @"latest";
                } else {
                    self->bundleId = [[NSUserDefaults standardUserDefaults] objectForKey:storeBundleId];
                }
                cell.textLabel.text = self->bundleId;
            } else if (clearBundleId) {
                cell.selectionStyle = UITableViewCellSelectionStyleGray;
                cell.textLabel.text = @"No bundle id(s) for the store";
            }
            break;
        case 4:
            cell.textLabel.text = @"Auto reload JS bundle";
            _reloadBundleSwitch = [[UISwitch alloc] initWithFrame:CGRectZero];
            [_reloadBundleSwitch addTarget:self action:@selector(reloadBundleSwitch:) forControlEvents:UIControlEventValueChanged];
            // ON by default
            [_reloadBundleSwitch setOn:[[NSUserDefaults standardUserDefaults] boolForKey:autoReloadBundle] animated:NO];
            cell.accessoryView = _reloadBundleSwitch;
            break;
        default:
            break;
    }
    if (indexPath.section != 0) {
        [cell setUserInteractionEnabled:isAvailable];
        [[cell textLabel] setEnabled:isAvailable];
    }
    return cell;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath {
    NSLog(@"%@ %@", indexPath, tableView);
    return 45.0;
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section {
    NSLog(@"%@", tableView);
    return titleForHeaders[section];
}

- (void)tableView:(UITableView *)tableView willDisplayHeaderView:(UIView *)view forSection:(NSInteger)section {
    NSLog(@"%ld %@", section,tableView);
    // Text Color
    UITableViewHeaderFooterView *header = (UITableViewHeaderFooterView *)view;
    if (section == 0) {
        header.textLabel.textAlignment = NSTextAlignmentCenter ;
        [header.textLabel setFont:[UIFont fontWithName:@"Avenir" size:23.0]];
        [header.textLabel setTextColor:[UIColor orangeColor]];
    }
    else {
        header.textLabel.textAlignment = NSTextAlignmentLeft;
        [header.textLabel setFont:[UIFont systemFontOfSize:14.0 weight:UIFontWeightUltraLight]];
    }
}

#pragma mark - UITableViewDelegate

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    if (indexPath.section == 1) {
        UIAlertController *alertController = [self createAlertControllerWithTitle:@"Input packager IP & port" message:nil];
        [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
            textField.placeholder = @"0.0.0.0";
        }];
        [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
            textField.placeholder = @"8080";
        }];
        [alertController addAction:[UIAlertAction actionWithTitle:@"Save" style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *action) {
            NSArray * textfields = alertController.textFields;
            UITextField * ipTextField = textfields[0];
            UITextField * portTextField = textfields[1];
            if(ipTextField.text.length == 0 && portTextField.text.length == 0) {
                return;
            }
            NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
            formatter.numberStyle = NSNumberFormatterDecimalStyle;
            NSNumber *portNumber = [formatter numberFromString:portTextField.text];
            if (portNumber == nil) {
                portNumber = [NSNumber numberWithInt:8080];
            }
            NSString *port = [NSString stringWithFormat:@"%@:%d",ipTextField.text, portNumber.intValue];
            [[NSUserDefaults standardUserDefaults] setObject:port forKey:packagerIPPort];
            self->packagerIPandPort = port;
            UITableViewCell *cell = [tableView cellForRowAtIndexPath:indexPath];
            cell.textLabel.text = self->packagerIPandPort;
            [self reloadTableView];
        }]];
        [self createCancelActionAndPresentAlertController:alertController];
    }
    if (indexPath.section == 2) {
        NSLog(@"Stores");
        [_activityView startAnimating];
        // Construct a URL similar to this Ex: http://10.74.57.21:8080/stores
        // get the packagerIP and port. default: localhost:8080
        NSString *hostandPort = [[NSUserDefaults standardUserDefaults] objectForKey:packagerIPPort];
        NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://%@/stores", hostandPort]]];
        NSURLSession *session = [NSURLSession sharedSession];
        NSURLSessionDataTask *task = [session dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
            [self stopAnimation];
            if (!error) {
                NSArray *lArray = [NSJSONSerialization JSONObjectWithData: data options:NSJSONReadingMutableContainers error:nil];
                self.bundleStoresRepo = lArray;
                UIAlertController * alertController = [self createAlertControllerWithTitle:@"Bundle Stores" message:@"Select a bundle store"];
                for (NSString *str in self.bundleStoresRepo) {
                 [alertController addAction:[UIAlertAction actionWithTitle:str style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *action) {
                    UITableViewCell *cell = [tableView cellForRowAtIndexPath:indexPath];
                    cell.textLabel.text = action.title;
                    self->selectedStore = action.title;
                    [[NSUserDefaults standardUserDefaults] setObject:self->selectedStore forKey:bundleStore];
                    [[NSUserDefaults standardUserDefaults] setObject:nil forKey:storeBundleId];
                    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT,0), ^{
                        [self networkCallRequestForABundleStore:action.title];
                    });
                    double delayInSeconds = 0.25;
                    dispatch_time_t waitTime = dispatch_time(DISPATCH_TIME_NOW, delayInSeconds * NSEC_PER_SEC);
                    dispatch_semaphore_wait(semaphore, waitTime);
                    ElectrodeBundle *bundle;
                    NSString *dateStr;
                    NSMutableArray *arr = [NSMutableArray array];
                    NSMutableArray *str = [NSMutableArray array];
                    for (id dict in self->ernBundleObjects) {
                        bundle = [[ElectrodeBundle alloc] init];
                        bundle.bundleId = [dict objectForKey:@"id"];
                        bundle.platform = [dict objectForKey:@"platform"];
                        bundle.sourceMap = [dict objectForKey:@"sourceMap"];
                        bundle.epochTimeInSeconds = [[dict objectForKey:@"timestamp"] doubleValue];
                        [arr addObject:bundle];
                        [self->bundleArray addObjectsFromArray:arr];
                        dateStr = [self convertToDateUsingEpochTime:bundle.epochTimeInSeconds];
                        [str addObject:dateStr];
                        [self->dateAndTime addObject:dateStr];
                        }
                    self->bundleArray = arr;
                    self->dateAndTime = str;
                    if (self->bundleArray.count == 0) {
                        [[NSUserDefaults standardUserDefaults] setObject:nil forKey:storeBundleId];
                        self->bundleId = nil;
                        self->clearBundleId = YES;
                        UIAlertController *alertController = [self createAlertControllerWithTitle:@"Sorry" message:@"There are no bundle ids for the store you selected!"];
                        [self createCancelActionAndPresentAlertController:alertController];
                        [self reloadTableView];
                        return;
                    } else {
                        self->bundleId = @"latest";
                        [[NSUserDefaults standardUserDefaults] setObject:[[self->bundleArray objectAtIndex:0] bundleId] forKey:storeBundleId];
                        [[NSUserDefaults standardUserDefaults] setBool:YES forKey:@"latestBundle"];
                    }
                    [self reloadTableView];
                    if ([self.delegate respondsToSelector:@selector(reloadBundle)]) {
                        [self.delegate reloadBundle];
                    }
                }]];
                }
                [self createCancelActionAndPresentAlertController:alertController];
            }
            else {
                UIAlertController *alertController = [self createAlertControllerWithTitle:@"Error" message:[error localizedDescription]];
                [self createCancelActionAndPresentAlertController:alertController];
            }
        }];
        [task resume];
    }
    if (indexPath.section == 3) {
        UIAlertController * alertController = [self createAlertControllerWithTitle:@"Bundles" message:@"Please select a bundle-store"];
        for (int i = 0; i< [self->bundleArray count]; i++) {
            [alertController addAction:[UIAlertAction actionWithTitle:self->dateAndTime[i] style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *action) {
                NSUInteger index = [[alertController actions] indexOfObject:action];
                if (index == 0) {
                    self->bundleId = @"latest";
                    [[NSUserDefaults standardUserDefaults] setObject:[[self->bundleArray objectAtIndex:i] bundleId] forKey:storeBundleId];
                    [[NSUserDefaults standardUserDefaults] setBool:YES forKey:latestBundle];
                }
                else {
                    self->bundleId = [[self->bundleArray objectAtIndex:i] bundleId];
                    [[NSUserDefaults standardUserDefaults] setObject:self->bundleId forKey:storeBundleId];
                    [[NSUserDefaults standardUserDefaults] setBool:NO forKey:latestBundle];
                }
                // instead of reload table view, just reload `reloadRowsAtIndexPaths`
                [self reloadTableView];
                if ([self.delegate respondsToSelector:@selector(reloadBundle)]) {
                    [self.delegate reloadBundle];
                }
            }]];
        }
        [self createCancelActionAndPresentAlertController:alertController];
    }
}


#pragma mark - Utility methods

// sets list of bundle ids for a specific store.
- (void)networkCallRequestForABundleStore:(NSString *)bundleStore {
    NSString *hostandPort = [[NSUserDefaults standardUserDefaults] objectForKey:packagerIPPort];
    NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://%@/bundles/%@/ios",hostandPort,bundleStore]]];
    NSURLSession *session = [NSURLSession sharedSession];
    NSURLSessionDataTask *task = [session dataTaskWithRequest:request completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        if (!error && data != nil) {
            NSArray *lArray = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:nil];
            self->ernBundleObjects = [[lArray reverseObjectEnumerator] allObjects];
            dispatch_semaphore_signal(semaphore);
        }
    }];
    [task resume];
}

- (void)stopAnimation {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self->_activityView stopAnimating];
    });
}

- (UIAlertController *)createAlertControllerWithTitle:(NSString *)title message:(NSString *)message {
    UIAlertController *alertController = [UIAlertController alertControllerWithTitle:title
                                                                             message:message
                                                                      preferredStyle:UIAlertControllerStyleAlert];
    return alertController;
}

- (void)reloadTableView {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self->_tableView reloadData];
    });
}

- (void)createCancelActionAndPresentAlertController:(UIAlertController *)alertController{
    [alertController addAction:[UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:^(__unused UIAlertAction *action){
        return;
    }]];
    [self presentViewController:alertController animated:YES completion:nil];
}

- (NSString *)convertToDateUsingEpochTime:(NSTimeInterval)epochTime {
    NSTimeInterval secs = epochTime/1000;
    NSDate *date = [[NSDate alloc] initWithTimeIntervalSince1970:secs];
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    [dateFormatter setLocale:[NSLocale currentLocale]];
    [dateFormatter setDateFormat:@"MM-dd-yyyy HH:mm a"];
    [dateFormatter setAMSymbol:@"AM"];
    [dateFormatter setPMSymbol:@"PM"];
    NSString *dateStr = [dateFormatter stringFromDate:date];
    return dateStr;
}


@end
