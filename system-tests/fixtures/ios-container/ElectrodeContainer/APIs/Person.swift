#if swift(>=4.0)
@objcMembers public class Person: ElectrodeObject, Bridgeable {

    private static let tag = String(describing: type(of: self))

    /**
     Persons name
     */
    public let name: String
    /**
     Persons birth year
     */
    public let birthYear: BirthYear?
    public let gender: String
    public let isAlive: Bool?

    public init(name: String, birthYear: BirthYear?, gender: String, isAlive: Bool?) {
        self.name = name
        self.birthYear = birthYear
        self.gender = gender
        self.isAlive = isAlive
        super.init()
    }

    public override init() {
        self.name = String()
        self.gender = String()
        self.birthYear = nil
        self.isAlive = nil
        super.init()
    }

    required public init(dictionary:[AnyHashable:Any]) {
        

        if let name = dictionary["name"] as? String  {
                  self.name = name
        } else {
            assertionFailure("\(Person.tag) missing one or more required properties [name] ")
            self.name = dictionary["name"] as! String
        }

                 

        if let gender = dictionary["gender"] as? String  {
                  self.gender = gender
        } else {
            assertionFailure("\(Person.tag) missing one or more required properties [gender] ")
            self.gender = dictionary["gender"] as! String
        }

         


        if let birthYearDict = dictionary["birthYear"] as? [AnyHashable: Any] {
            self.birthYear = BirthYear(dictionary: birthYearDict)
        } else {
            self.birthYear = nil
        }
        

        if let isAlive = dictionary["isAlive"] as? Bool {
            self.isAlive = isAlive
        } else {
            self.isAlive = nil
        }
        
        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {

         var dict = [:] as [AnyHashable : Any]

         dict["name"] =  self.name
dict["gender"] =  self.gender

        if let nonNullBirthYear = self.birthYear {
                dict["birthYear"] = nonNullBirthYear.toDictionary()
        }
        if let nonNullIsAlive = self.isAlive {
                dict["isAlive"] = nonNullIsAlive
        }
        return dict as NSDictionary
    }
}
#else

public class Person: ElectrodeObject, Bridgeable {

    private static let tag = String(describing: type(of: self))

    /**
     Persons name
     */
    public let name: String
    /**
     Persons birth year
     */
    public let birthYear: BirthYear?
    public let gender: String
    public let isAlive: Bool?

    public init(name: String, birthYear: BirthYear?, gender: String, isAlive: Bool?) {
        self.name = name
        self.birthYear = birthYear
        self.gender = gender
        self.isAlive = isAlive
        super.init()
    }

    public override init() {
        self.name = String()
        self.gender = String()
        self.birthYear = nil
        self.isAlive = nil
        super.init()
    }

    required public init(dictionary:[AnyHashable:Any]) {
        

        if let name = dictionary["name"] as? String  {
                  self.name = name
        } else {
            assertionFailure("\(Person.tag) missing one or more required properties [name] ")
            self.name = dictionary["name"] as! String
        }

                 

        if let gender = dictionary["gender"] as? String  {
                  self.gender = gender
        } else {
            assertionFailure("\(Person.tag) missing one or more required properties [gender] ")
            self.gender = dictionary["gender"] as! String
        }

         


        if let birthYearDict = dictionary["birthYear"] as? [AnyHashable: Any] {
            self.birthYear = BirthYear(dictionary: birthYearDict)
        } else {
            self.birthYear = nil
        }
        

        if let isAlive = dictionary["isAlive"] as? Bool {
            self.isAlive = isAlive
        } else {
            self.isAlive = nil
        }
        
        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {

         var dict = [:] as [AnyHashable : Any]

         dict["name"] =  self.name
dict["gender"] =  self.gender

        if let nonNullBirthYear = self.birthYear {
                dict["birthYear"] = nonNullBirthYear.toDictionary()
        }
        if let nonNullIsAlive = self.isAlive {
                dict["isAlive"] = nonNullIsAlive
        }
        return dict as NSDictionary
    }
}
#endif
