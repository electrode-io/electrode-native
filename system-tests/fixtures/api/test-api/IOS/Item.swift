#if swift(>=4.0)
@objcMembers public class Item: ElectrodeObject, Bridgeable {
    private static let tag = String(describing: type(of: self))

    public let id: Int64
    public let name: String
    public let desc: String?

    public init(id: Int64, name: String, desc: String?) {
        self.id = id
        self.name = name
        self.desc = desc
        super.init()
    }

    public override init() {
        self.id = Int64()
        self.name = String()
        self.desc = nil
        super.init()
    }

    public required init(dictionary: [AnyHashable: Any]) {
        if let id = dictionary["id"] as? Int64 {
            self.id = id
        } else {
            assertionFailure("\(Item.tag) missing one or more required properties [id]")
            self.id = dictionary["id"] as! Int64
        }
        if let name = dictionary["name"] as? String {
            self.name = name
        } else {
            assertionFailure("\(Item.tag) missing one or more required properties [name]")
            self.name = dictionary["name"] as! String
        }

        if let desc = dictionary["desc"] as? String {
            self.desc = desc
        } else {
            self.desc = nil
        }

        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {
        var dict = [:] as [AnyHashable: Any]

        dict["id"] = self.id
        dict["name"] = self.name

        if let nonNullDesc = self.desc {
            dict["desc"] = nonNullDesc
        }
        return dict as NSDictionary
    }
}

#else

public class Item: ElectrodeObject, Bridgeable {
    private static let tag = String(describing: type(of: self))

    public let id: Int64
    public let name: String
    public let desc: String?

    public init(id: Int64, name: String, desc: String?) {
        self.id = id
        self.name = name
        self.desc = desc
        super.init()
    }

    public override init() {
        self.id = Int64()
        self.name = String()
        self.desc = nil
        super.init()
    }

    public required init(dictionary: [AnyHashable: Any]) {
        if let id = dictionary["id"] as? Int64 {
            self.id = id
        } else {
            assertionFailure("\(Item.tag) missing one or more required properties [id]")
            self.id = dictionary["id"] as! Int64
        }
        if let name = dictionary["name"] as? String {
            self.name = name
        } else {
            assertionFailure("\(Item.tag) missing one or more required properties [name]")
            self.name = dictionary["name"] as! String
        }

        if let desc = dictionary["desc"] as? String {
            self.desc = desc
        } else {
            self.desc = nil
        }

        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {
        var dict = [:] as [AnyHashable: Any]

        dict["id"] = self.id
        dict["name"] = self.name

        if let nonNullDesc = self.desc {
            dict["desc"] = nonNullDesc
        }
        return dict as NSDictionary
    }
}
#endif
