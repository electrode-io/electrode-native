#if swift(>=4.0)
@objcMembers public class NavBarButton: ElectrodeObject, Bridgeable {

    private static let tag = String(describing: type(of: self))

    /**
     Name of button
     */
    public let name: String
    /**
     Id of the button
     */
    public let identifier: String
    /**
     Set to true for showing icon
     */
    public let showIcon: Bool?

    public init(name: String, identifier: String, showIcon: Bool?) {
        self.name = name
        self.identifier = identifier
        self.showIcon = showIcon
        super.init()
    }

    public override init() {
        self.name = String()
        self.identifier = String()
        self.showIcon = nil
        super.init()
    }

    required public init(dictionary:[AnyHashable:Any]) {
        

        if let name = dictionary["name"] as? String  {
                  self.name = name
        } else {
            assertionFailure("\(NavBarButton.tag) missing one or more required properties [name] ")
            self.name = dictionary["name"] as! String
        }

                 

        if let identifier = dictionary["identifier"] as? String  {
                  self.identifier = identifier
        } else {
            assertionFailure("\(NavBarButton.tag) missing one or more required properties [identifier] ")
            self.identifier = dictionary["identifier"] as! String
        }

         


        if let showIcon = dictionary["showIcon"] as? Bool {
            self.showIcon = showIcon
        } else {
            self.showIcon = nil
        }
        
        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {

         var dict = [:] as [AnyHashable : Any]

         dict["name"] =  self.name
dict["identifier"] =  self.identifier

        if let nonNullShowIcon = self.showIcon {
                dict["showIcon"] = nonNullShowIcon
        }
        return dict as NSDictionary
    }
}
#else

public class NavBarButton: ElectrodeObject, Bridgeable {

    private static let tag = String(describing: type(of: self))

    /**
     Name of button
     */
    public let name: String
    /**
     Id of the button
     */
    public let identifier: String
    /**
     Set to true for showing icon
     */
    public let showIcon: Bool?

    public init(name: String, identifier: String, showIcon: Bool?) {
        self.name = name
        self.identifier = identifier
        self.showIcon = showIcon
        super.init()
    }

    public override init() {
        self.name = String()
        self.identifier = String()
        self.showIcon = nil
        super.init()
    }

    required public init(dictionary:[AnyHashable:Any]) {
        

        if let name = dictionary["name"] as? String  {
                  self.name = name
        } else {
            assertionFailure("\(NavBarButton.tag) missing one or more required properties [name] ")
            self.name = dictionary["name"] as! String
        }

                 

        if let identifier = dictionary["identifier"] as? String  {
                  self.identifier = identifier
        } else {
            assertionFailure("\(NavBarButton.tag) missing one or more required properties [identifier] ")
            self.identifier = dictionary["identifier"] as! String
        }

         


        if let showIcon = dictionary["showIcon"] as? Bool {
            self.showIcon = showIcon
        } else {
            self.showIcon = nil
        }
        
        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {

         var dict = [:] as [AnyHashable : Any]

         dict["name"] =  self.name
dict["identifier"] =  self.identifier

        if let nonNullShowIcon = self.showIcon {
                dict["showIcon"] = nonNullShowIcon
        }
        return dict as NSDictionary
    }
}
#endif
