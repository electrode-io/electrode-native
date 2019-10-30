#if swift(>=4.0)
@objcMembers public class TestMultiArgsData: ElectrodeObject, Bridgeable {

    private static let tag = String(describing: type(of: self))

    public let key1: String
    public let key2: Int

    public init(key1: String, key2: Int) {
        self.key1 = key1
        self.key2 = key2
        super.init()
    }

    public override init() {
        self.key1 = String()
        self.key2 = Int()
        super.init()
    }

    required public init(dictionary:[AnyHashable:Any]) {
        if

                let key1 = dictionary["key1"] as? String,

                let key2 = dictionary["key2"] as? Int { 
            self.key1 = key1
            self.key2 = key2
        } else {
            assertionFailure("\(TestMultiArgsData.tag) missing one or more required properties[key1,key2]")
            self.key1 = dictionary["key1"] as! String
            self.key2 = dictionary["key2"] as! Int
        }


        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {
        var dict =  [
            "key1": self.key1,
            "key2": self.key2
        ] as [AnyHashable : Any]

        return dict as NSDictionary
    }

}
#else
public class TestMultiArgsData: ElectrodeObject, Bridgeable {

    private static let tag = String(describing: type(of: self))

    public let key1: String
    public let key2: Int

    public init(key1: String, key2: Int) {
        self.key1 = key1
        self.key2 = key2
        super.init()
    }

    public override init() {
        self.key1 = String()
        self.key2 = Int()
        super.init()
    }

    required public init(dictionary:[AnyHashable:Any]) {
        if

                let key1 = dictionary["key1"] as? String,

                let key2 = dictionary["key2"] as? Int { 
            self.key1 = key1
            self.key2 = key2
        } else {
            assertionFailure("\(TestMultiArgsData.tag) missing one or more required properties[key1,key2]")
            self.key1 = dictionary["key1"] as! String
            self.key2 = dictionary["key2"] as! Int
        }


        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {
        var dict =  [
            "key1": self.key1,
            "key2": self.key2
        ] as [AnyHashable : Any]

        return dict as NSDictionary
    }

}
#endif
