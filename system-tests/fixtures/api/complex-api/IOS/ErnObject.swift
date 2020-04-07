#if swift(>=4.0)
@objcMembers public class ErnObject: ElectrodeObject, Bridgeable {
    private static let tag = String(describing: type(of: self))

    public let name: String
    public let value: String?
    public let domain: String?
    public let path: String?
    public let uri: String?
    public let version: Double
    public let expiry: Int64?
    public let leftButton: NavBarButton?
    /**
     Right button properties
     */
    public let rightButtons: [NavBarButton]?
    /**
     specify if user is a guest
     */
    public let isGuestUser: Bool?
    /**
     specify merge type
     */
    public let mergeType: Int?

    public init(name: String, value: String?, domain: String?, path: String?, uri: String?, version: Double, expiry: Int64?, leftButton: NavBarButton?, rightButtons: [NavBarButton]?, isGuestUser: Bool?, mergeType: Int?) {
        self.name = name
        self.value = value
        self.domain = domain
        self.path = path
        self.uri = uri
        self.version = version
        self.expiry = expiry
        self.leftButton = leftButton
        self.rightButtons = rightButtons
        self.isGuestUser = isGuestUser
        self.mergeType = mergeType
        super.init()
    }

    public override init() {
        name = String()
        version = Double()
        value = nil
        domain = nil
        path = nil
        uri = nil
        expiry = nil
        leftButton = nil
        rightButtons = nil
        isGuestUser = nil
        mergeType = nil
        super.init()
    }

    public required init(dictionary: [AnyHashable: Any]) {
        if let name = dictionary["name"] as? String {
            self.name = name
        } else {
            assertionFailure("\(ErnObject.tag) missing one or more required properties [name]")
            name = dictionary["name"] as! String
        }
        if let version = dictionary["version"] as? Double {
            self.version = version
        } else {
            assertionFailure("\(ErnObject.tag) missing one or more required properties [version]")
            version = dictionary["version"] as! Double
        }

        if let value = dictionary["value"] as? String {
            value = value
        } else {
            value = nil
        }
        if let domain = dictionary["domain"] as? String {
            domain = domain
        } else {
            domain = nil
        }
        if let path = dictionary["path"] as? String {
            path = path
        } else {
            path = nil
        }
        if let uri = dictionary["uri"] as? String {
            uri = uri
        } else {
            uri = nil
        }
        if let expiry = dictionary["expiry"] as? Int64 {
            expiry = expiry
        } else {
            expiry = nil
        }
        if let leftButtonDict = dictionary["leftButton"] as? [AnyHashable: Any] {
            leftButton = NavBarButton(dictionary: leftButtonDict)
        } else {
            leftButton = nil
        }
        if let validRightButtons = try? NSObject.generateObject(data: dictionary["rightButtons"], classType: [Any].self, itemType: NavBarButton.self),
            let rightButtonsList = validRightButtons as? [NavBarButton] {
            rightButtons = rightButtonsList
        } else {
            rightButtons = nil
        }
        if let isGuestUser = dictionary["isGuestUser"] as? Bool {
            isGuestUser = isGuestUser
        } else {
            isGuestUser = nil
        }
        if let mergeType = dictionary["mergeType"] as? Int {
            mergeType = mergeType
        } else {
            mergeType = nil
        }

        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {
        var dict = [:] as [AnyHashable: Any]

        dict["name"] = name
        dict["version"] = version

        if let nonNullValue = value {
            dict["value"] = nonNullValue
        }
        if let nonNullDomain = domain {
            dict["domain"] = nonNullDomain
        }
        if let nonNullPath = path {
            dict["path"] = nonNullPath
        }
        if let nonNullUri = uri {
            dict["uri"] = nonNullUri
        }
        if let nonNullExpiry = expiry {
            dict["expiry"] = nonNullExpiry
        }
        if let nonNullLeftButton = leftButton {
            dict["leftButton"] = nonNullLeftButton.toDictionary()
        }
        if let nonNullRightButtons = rightButtons {
            dict["rightButtons"] = nonNullRightButtons.map { $0.toDictionary() }
        }
        if let nonNullIsGuestUser = isGuestUser {
            dict["isGuestUser"] = nonNullIsGuestUser
        }
        if let nonNullMergeType = mergeType {
            dict["mergeType"] = nonNullMergeType
        }
        return dict as NSDictionary
    }
}

#else

public class ErnObject: ElectrodeObject, Bridgeable {
    private static let tag = String(describing: type(of: self))

    public let name: String
    public let value: String?
    public let domain: String?
    public let path: String?
    public let uri: String?
    public let version: Double
    public let expiry: Int64?
    public let leftButton: NavBarButton?
    /**
     Right button properties
     */
    public let rightButtons: [NavBarButton]?
    /**
     specify if user is a guest
     */
    public let isGuestUser: Bool?
    /**
     specify merge type
     */
    public let mergeType: Int?

    public init(name: String, value: String?, domain: String?, path: String?, uri: String?, version: Double, expiry: Int64?, leftButton: NavBarButton?, rightButtons: [NavBarButton]?, isGuestUser: Bool?, mergeType: Int?) {
        self.name = name
        self.value = value
        self.domain = domain
        self.path = path
        self.uri = uri
        self.version = version
        self.expiry = expiry
        self.leftButton = leftButton
        self.rightButtons = rightButtons
        self.isGuestUser = isGuestUser
        self.mergeType = mergeType
        super.init()
    }

    public override init() {
        name = String()
        version = Double()
        value = nil
        domain = nil
        path = nil
        uri = nil
        expiry = nil
        leftButton = nil
        rightButtons = nil
        isGuestUser = nil
        mergeType = nil
        super.init()
    }

    public required init(dictionary: [AnyHashable: Any]) {
        if let name = dictionary["name"] as? String {
            self.name = name
        } else {
            assertionFailure("\(ErnObject.tag) missing one or more required properties [name]")
            name = dictionary["name"] as! String
        }
        if let version = dictionary["version"] as? Double {
            self.version = version
        } else {
            assertionFailure("\(ErnObject.tag) missing one or more required properties [version]")
            version = dictionary["version"] as! Double
        }

        if let value = dictionary["value"] as? String {
            value = value
        } else {
            value = nil
        }
        if let domain = dictionary["domain"] as? String {
            domain = domain
        } else {
            domain = nil
        }
        if let path = dictionary["path"] as? String {
            path = path
        } else {
            path = nil
        }
        if let uri = dictionary["uri"] as? String {
            uri = uri
        } else {
            uri = nil
        }
        if let expiry = dictionary["expiry"] as? Int64 {
            expiry = expiry
        } else {
            expiry = nil
        }
        if let leftButtonDict = dictionary["leftButton"] as? [AnyHashable: Any] {
            leftButton = NavBarButton(dictionary: leftButtonDict)
        } else {
            leftButton = nil
        }
        if let validRightButtons = try? NSObject.generateObject(data: dictionary["rightButtons"], classType: [Any].self, itemType: NavBarButton.self),
            let rightButtonsList = validRightButtons as? [NavBarButton] {
            rightButtons = rightButtonsList
        } else {
            rightButtons = nil
        }
        if let isGuestUser = dictionary["isGuestUser"] as? Bool {
            isGuestUser = isGuestUser
        } else {
            isGuestUser = nil
        }
        if let mergeType = dictionary["mergeType"] as? Int {
            mergeType = mergeType
        } else {
            mergeType = nil
        }

        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {
        var dict = [:] as [AnyHashable: Any]

        dict["name"] = name
        dict["version"] = version

        if let nonNullValue = value {
            dict["value"] = nonNullValue
        }
        if let nonNullDomain = domain {
            dict["domain"] = nonNullDomain
        }
        if let nonNullPath = path {
            dict["path"] = nonNullPath
        }
        if let nonNullUri = uri {
            dict["uri"] = nonNullUri
        }
        if let nonNullExpiry = expiry {
            dict["expiry"] = nonNullExpiry
        }
        if let nonNullLeftButton = leftButton {
            dict["leftButton"] = nonNullLeftButton.toDictionary()
        }
        if let nonNullRightButtons = rightButtons {
            dict["rightButtons"] = nonNullRightButtons.map { $0.toDictionary() }
        }
        if let nonNullIsGuestUser = isGuestUser {
            dict["isGuestUser"] = nonNullIsGuestUser
        }
        if let nonNullMergeType = mergeType {
            dict["mergeType"] = nonNullMergeType
        }
        return dict as NSDictionary
    }
}
#endif
