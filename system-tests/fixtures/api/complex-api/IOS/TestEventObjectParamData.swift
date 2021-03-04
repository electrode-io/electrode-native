#if swift(>=4.0)
@objcMembers public class TestEventObjectParamData: ElectrodeObject, Bridgeable {
    private static let tag = String(describing: type(of: self))

    public let param1: String?
    public let param2: AnyObject?

    public init(param1: String, param2: AnyObject) {
        self.param1 = param1
        self.param2 = param2
        super.init()
    }

    public override init() {
        self.param1 = nil
        self.param2 = nil
        super.init()
    }

    public required init(dictionary: [AnyHashable: Any]) {
        if
        {
        } else {
            assertionFailure("\(TestEventObjectParamData.tag) missing one or more required properties[]")
        }

        param1 = dictionary["param1"] as? String
        param2 = dictionary["param2"] as? AnyObject

        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {
        var dict = [
        ] as [AnyHashable: Any]

        if let nonNullparam1 = self.param1 {
            dict["param1"] = nonNullparam1
        }
        if let nonNullparam2 = self.param2 {
            dict["param2"] = nonNullparam2
        }
        return dict as NSDictionary
    }
}

#else

public class TestEventObjectParamData: ElectrodeObject, Bridgeable {
    private static let tag = String(describing: type(of: self))

    public let param1: String?
    public let param2: AnyObject?

    public init(param1: String, param2: AnyObject) {
        self.param1 = param1
        self.param2 = param2
        super.init()
    }

    public override init() {
        self.param1 = nil
        self.param2 = nil
        super.init()
    }

    public required init(dictionary: [AnyHashable: Any]) {
        if
        {
        } else {
            assertionFailure("\(TestEventObjectParamData.tag) missing one or more required properties[]")
        }

        self.param1 = dictionary["param1"] as? String
        self.param2 = dictionary["param2"] as? AnyObject

        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {
        var dict = [
        ] as [AnyHashable: Any]

        if let nonNullparam1 = self.param1 {
            dict["param1"] = nonNullparam1
        }
        if let nonNullparam2 = self.param2 {
            dict["param2"] = nonNullparam2
        }
        return dict as NSDictionary
    }
}

#endif
