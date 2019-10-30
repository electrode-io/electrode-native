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

import UIKit

let kElectrodeBridgeRequestTimeoutTime = 10

let objectiveCPrimitives = [
    String.self,
    String?.self,
    Double.self,
    Float.self,
    Bool.self,
    Int.self,
    Int?.self,
    Int8.self,
    Int16.self,
    Int32.self,
    Int64.self,
] as [Any.Type]

enum Property<AnyClass> {
    case Class(AnyClass)
    case Struct
}

public enum GenerateObjectError: Error {
    case arrayTypeMissmatch
    case emptyArrayItemType
    case unsupportedType
    case unBridgeable
    case deserializationError
}

extension NSObject {

    // Returns the property type
    func getTypeOfProperty(_ name: String) -> Property<Any>? {

        var type: Mirror = Mirror(reflecting: self)

        for child in type.children {
            if child.label! == name {
                #if swift(>=4.0)
                let res = Swift.type(of: child.value)
                #else
                let res = type(of: child.value)
                #endif
                let tmp = ElectrodeUtilities.isObjectiveCPrimitives(type: res)
                return (!tmp) ? .Class(res) : .Struct
            }
        }
        while let parent = type.superclassMirror {
            for child in parent.children {
                if child.label! == name {
                    #if swift(>=4.0)
                    let res = Swift.type(of: child.value)
                    #else
                    let res = type(of: child.value)
                    #endif
                    let tmp = ElectrodeUtilities.isObjectiveCPrimitives(type: res)
                    return (tmp) ? .Class(res) : .Struct
                }
            }
            type = parent
        }
        return nil
    }

    func toNSDictionary() -> NSDictionary {
        let type: Mirror = Mirror(reflecting: self)
        var res = [AnyHashable: Any]()
        for case let (label, value) in type.children {
            res[label!] = value
        }
        return res as NSDictionary
    }

    static func generateObjectFromDict(data: [AnyHashable: Any], passedClass: AnyClass) throws -> AnyObject {
        let stringForClass = String(reflecting: passedClass)
        guard let obj = NSClassFromString(stringForClass) as? ElectrodeObject.Type else {
            assertionFailure("Cannot proceed to convert dictionary to object type \(passedClass)")
            return NSObject()
        }

        let res = obj.init(dictionary: data)
        return res
    }

    public static func generateObject(data: Any, classType: Any.Type, itemType: Any.Type? = nil) throws -> Any {
        var res: Any
        // check to see if the type already matches. so no need to serialize or deserialize
        if type(of: data) == classType && !(data is Array<Any>) {
            return data
        }

        if ElectrodeUtilities.isObjectiveCPrimitives(type: classType) {
            res = data
        } else if data is NSDictionary {
            if let convertableData = data as? [AnyHashable: AnyObject] {
                let obj = try NSObject.generateObjectFromDict(data: convertableData, passedClass: classType as! AnyClass)
                res = obj
            } else {
                assertionFailure("failed here")
                return NSString()
            }
        } else if data is Array<Any> {
            if let arrayData = data as? Array<Any> {
                var tmpRes = Array<AnyObject>()
                guard let validItemType = itemType else { throw GenerateObjectError.emptyArrayItemType }
                for item in arrayData {
                    var obj: AnyObject
                    if ElectrodeUtilities.isObjectiveCPrimitives(type: validItemType) {
                        obj = item as AnyObject
                    } else {
                        obj = try NSObject.generateObject(data: item as AnyObject, classType: validItemType) as AnyObject
                    }
                    tmpRes.append(obj)
                }
                res = tmpRes as AnyObject
            } else {
                throw GenerateObjectError.unsupportedType
            }
        } else {
            throw GenerateObjectError.unsupportedType
        }
        return res
    }
}

@objc class ElectrodeUtilities: NSObject {

    static func isObjectiveCPrimitives(type: Any.Type) -> Bool {
        return (objectiveCPrimitives.contains(where: { (aClass) -> Bool in
            aClass == type
        }))
    }

    static func convertObjectToBridgeMessageData(object: Any?) -> Any? {

        if let objectArray = object as? NSArray {
            let converted = ElectrodeUtilities.convertArrayToDictionary(object: objectArray)
            return converted
        }

        let convertedData = ElectrodeUtilities.convertSingleItemToBridgeReadyData(object: object)
        return convertedData
    }

    private static func convertArrayToDictionary(object: NSArray) -> Array<Any?> {
        var res = [Any?]()
        for item in object {
            if let itemArray = item as? NSArray {
                let convertedArray = ElectrodeUtilities.convertArrayToDictionary(object: itemArray)
                res.append(convertedArray)
            } else {
                let convertedItem = ElectrodeUtilities.convertSingleItemToBridgeReadyData(object: item)
                res.append(convertedItem)
            }
        }
        return res
    }

    private static func convertSingleItemToBridgeReadyData(object: Any?) -> Any? {
        let bridgeMessageReadyDictionary: Any?
        guard let validObject = object else {
            bridgeMessageReadyDictionary = nil
            return bridgeMessageReadyDictionary
        }
        #if swift(>=4.0)
        let type = Swift.type(of: validObject)
        #else
        let type = type(of: validObject)
        #endif
        if ElectrodeUtilities.isObjectiveCPrimitives(type: type) {
            return validObject
        }

        if let bridgeableObject = validObject as? Bridgeable {
            bridgeMessageReadyDictionary = bridgeableObject.toDictionary()
            return bridgeMessageReadyDictionary
        }

        return nil
    }
}
