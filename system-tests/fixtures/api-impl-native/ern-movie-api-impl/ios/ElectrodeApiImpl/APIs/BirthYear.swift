#if swift(>=4.0)
@objcMembers public class BirthYear: ElectrodeObject, Bridgeable {

    private static let tag = String(describing: type(of: self))

    /**
     Birth month
     */
    public let month: Int?
    /**
     Birth year
     */
    public let year: Int?
    /**
     Birth date
     */
    public let date: Int?
    /**
     Birth place
     */
    public let place: String?

    public init(month: Int?, year: Int?, date: Int?, place: String?) {
        self.month = month
        self.year = year
        self.date = date
        self.place = place
        super.init()
    }

    public override init() {
        self.month = nil
        self.year = nil
        self.date = nil
        self.place = nil
        super.init()
    }

    required public init(dictionary:[AnyHashable:Any]) {



        if let month = dictionary["month"] as? Int {
            self.month = month
        } else {
            self.month = nil
        }
        

        if let year = dictionary["year"] as? Int {
            self.year = year
        } else {
            self.year = nil
        }
        

        if let date = dictionary["date"] as? Int {
            self.date = date
        } else {
            self.date = nil
        }
        

        if let place = dictionary["place"] as? String {
            self.place = place
        } else {
            self.place = nil
        }
        
        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {

         var dict = [:] as [AnyHashable : Any]

         
        if let nonNullMonth = self.month {
                dict["month"] = nonNullMonth
        }
        if let nonNullYear = self.year {
                dict["year"] = nonNullYear
        }
        if let nonNullDate = self.date {
                dict["date"] = nonNullDate
        }
        if let nonNullPlace = self.place {
                dict["place"] = nonNullPlace
        }
        return dict as NSDictionary
    }
}
#else

public class BirthYear: ElectrodeObject, Bridgeable {

    private static let tag = String(describing: type(of: self))

    /**
     Birth month
     */
    public let month: Int?
    /**
     Birth year
     */
    public let year: Int?
    /**
     Birth date
     */
    public let date: Int?
    /**
     Birth place
     */
    public let place: String?

    public init(month: Int?, year: Int?, date: Int?, place: String?) {
        self.month = month
        self.year = year
        self.date = date
        self.place = place
        super.init()
    }

    public override init() {
        self.month = nil
        self.year = nil
        self.date = nil
        self.place = nil
        super.init()
    }

    required public init(dictionary:[AnyHashable:Any]) {



        if let month = dictionary["month"] as? Int {
            self.month = month
        } else {
            self.month = nil
        }
        

        if let year = dictionary["year"] as? Int {
            self.year = year
        } else {
            self.year = nil
        }
        

        if let date = dictionary["date"] as? Int {
            self.date = date
        } else {
            self.date = nil
        }
        

        if let place = dictionary["place"] as? String {
            self.place = place
        } else {
            self.place = nil
        }
        
        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {

         var dict = [:] as [AnyHashable : Any]

         
        if let nonNullMonth = self.month {
                dict["month"] = nonNullMonth
        }
        if let nonNullYear = self.year {
                dict["year"] = nonNullYear
        }
        if let nonNullDate = self.date {
                dict["date"] = nonNullDate
        }
        if let nonNullPlace = self.place {
                dict["place"] = nonNullPlace
        }
        return dict as NSDictionary
    }
}
#endif
