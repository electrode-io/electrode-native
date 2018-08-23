#if swift(>=4.0)
@objcMembers public class NavigateData: ElectrodeObject, Bridgeable {

    private static let tag = String(describing: type(of: self))

    public let miniAppName: String
    public let initialPayload: String?

    public init(miniAppName: String, initialPayload: String) {
        self.miniAppName = miniAppName
        self.initialPayload = initialPayload
        super.init()
    }

    public override init() {
        self.miniAppName = String()
        self.initialPayload = nil
        super.init()
    }

    required public init(dictionary:[AnyHashable:Any]) {
        if

                let miniAppName = dictionary["miniAppName"] as? String { 
            self.miniAppName = miniAppName
        } else {
            assertionFailure("\(NavigateData.tag) missing one or more required properties[miniAppName]")
            self.miniAppName = dictionary["miniAppName"] as! String
        }

        self.initialPayload = dictionary["initialPayload"] as? String

        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {
        var dict =  [
            "miniAppName": self.miniAppName
        ] as [AnyHashable : Any]

        if let nonNullinitialPayload = self.initialPayload {
            dict["initialPayload"] = nonNullinitialPayload
        }
        return dict as NSDictionary
    }

}
#else
public class NavigateData: ElectrodeObject, Bridgeable {

    private static let tag = String(describing: type(of: self))

    public let miniAppName: String
    public let initialPayload: String?

    public init(miniAppName: String, initialPayload: String) {
        self.miniAppName = miniAppName
        self.initialPayload = initialPayload
        super.init()
    }

    public override init() {
        self.miniAppName = String()
        self.initialPayload = nil
        super.init()
    }

    required public init(dictionary:[AnyHashable:Any]) {
        if

                let miniAppName = dictionary["miniAppName"] as? String { 
            self.miniAppName = miniAppName
        } else {
            assertionFailure("\(NavigateData.tag) missing one or more required properties[miniAppName]")
            self.miniAppName = dictionary["miniAppName"] as! String
        }

        self.initialPayload = dictionary["initialPayload"] as? String

        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {
        var dict =  [
            "miniAppName": self.miniAppName
        ] as [AnyHashable : Any]

        if let nonNullinitialPayload = self.initialPayload {
            dict["initialPayload"] = nonNullinitialPayload
        }
        return dict as NSDictionary
    }

}
#endif
