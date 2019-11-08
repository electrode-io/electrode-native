#if swift(>=4.0)
@objcMembers public class Synopsis: ElectrodeObject, Bridgeable {

    private static let tag = String(describing: type(of: self))

    public let director: Person?
    public let cast: [Person]?
    public let language: String?
    public let country: String?
    public let rating: String?
    /**
     Runtime in minutes
     */
    public let runtime: Int?
    public let releaseDate: String?

    public init(director: Person?, cast: [Person]?, language: String?, country: String?, rating: String?, runtime: Int?, releaseDate: String?) {
        self.director = director
        self.cast = cast
        self.language = language
        self.country = country
        self.rating = rating
        self.runtime = runtime
        self.releaseDate = releaseDate
        super.init()
    }

    public override init() {
        self.director = nil
        self.cast = nil
        self.language = nil
        self.country = nil
        self.rating = nil
        self.runtime = nil
        self.releaseDate = nil
        super.init()
    }

    required public init(dictionary:[AnyHashable:Any]) {



        if let directorDict = dictionary["director"] as? [AnyHashable: Any] {
            self.director = Person(dictionary: directorDict)
        } else {
            self.director = nil
        }
        
        if let validCast = try? NSObject.generateObject(data: dictionary["cast"], classType: Array<Any>.self, itemType: Person.self),
           let castList = validCast as? [Person] {
            self.cast = castList
        } else {
            self.cast = nil
        }


        if let language = dictionary["language"] as? String {
            self.language = language
        } else {
            self.language = nil
        }
        

        if let country = dictionary["country"] as? String {
            self.country = country
        } else {
            self.country = nil
        }
        

        if let rating = dictionary["rating"] as? String {
            self.rating = rating
        } else {
            self.rating = nil
        }
        

        if let runtime = dictionary["runtime"] as? Int {
            self.runtime = runtime
        } else {
            self.runtime = nil
        }
        

        if let releaseDate = dictionary["releaseDate"] as? String {
            self.releaseDate = releaseDate
        } else {
            self.releaseDate = nil
        }
        
        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {

         var dict = [:] as [AnyHashable : Any]

         
        if let nonNullDirector = self.director {
                dict["director"] = nonNullDirector.toDictionary()
        }
        if let nonNullCast = self.cast {
                dict["cast"] = nonNullCast.map{$0.toDictionary()}
        }
        if let nonNullLanguage = self.language {
                dict["language"] = nonNullLanguage
        }
        if let nonNullCountry = self.country {
                dict["country"] = nonNullCountry
        }
        if let nonNullRating = self.rating {
                dict["rating"] = nonNullRating
        }
        if let nonNullRuntime = self.runtime {
                dict["runtime"] = nonNullRuntime
        }
        if let nonNullReleaseDate = self.releaseDate {
                dict["releaseDate"] = nonNullReleaseDate
        }
        return dict as NSDictionary
    }
}
#else

public class Synopsis: ElectrodeObject, Bridgeable {

    private static let tag = String(describing: type(of: self))

    public let director: Person?
    public let cast: [Person]?
    public let language: String?
    public let country: String?
    public let rating: String?
    /**
     Runtime in minutes
     */
    public let runtime: Int?
    public let releaseDate: String?

    public init(director: Person?, cast: [Person]?, language: String?, country: String?, rating: String?, runtime: Int?, releaseDate: String?) {
        self.director = director
        self.cast = cast
        self.language = language
        self.country = country
        self.rating = rating
        self.runtime = runtime
        self.releaseDate = releaseDate
        super.init()
    }

    public override init() {
        self.director = nil
        self.cast = nil
        self.language = nil
        self.country = nil
        self.rating = nil
        self.runtime = nil
        self.releaseDate = nil
        super.init()
    }

    required public init(dictionary:[AnyHashable:Any]) {



        if let directorDict = dictionary["director"] as? [AnyHashable: Any] {
            self.director = Person(dictionary: directorDict)
        } else {
            self.director = nil
        }
        
        if let validCast = try? NSObject.generateObject(data: dictionary["cast"], classType: Array<Any>.self, itemType: Person.self),
           let castList = validCast as? [Person] {
            self.cast = castList
        } else {
            self.cast = nil
        }


        if let language = dictionary["language"] as? String {
            self.language = language
        } else {
            self.language = nil
        }
        

        if let country = dictionary["country"] as? String {
            self.country = country
        } else {
            self.country = nil
        }
        

        if let rating = dictionary["rating"] as? String {
            self.rating = rating
        } else {
            self.rating = nil
        }
        

        if let runtime = dictionary["runtime"] as? Int {
            self.runtime = runtime
        } else {
            self.runtime = nil
        }
        

        if let releaseDate = dictionary["releaseDate"] as? String {
            self.releaseDate = releaseDate
        } else {
            self.releaseDate = nil
        }
        
        super.init(dictionary: dictionary)
    }

    public func toDictionary() -> NSDictionary {

         var dict = [:] as [AnyHashable : Any]

         
        if let nonNullDirector = self.director {
                dict["director"] = nonNullDirector.toDictionary()
        }
        if let nonNullCast = self.cast {
                dict["cast"] = nonNullCast.map{$0.toDictionary()}
        }
        if let nonNullLanguage = self.language {
                dict["language"] = nonNullLanguage
        }
        if let nonNullCountry = self.country {
                dict["country"] = nonNullCountry
        }
        if let nonNullRating = self.rating {
                dict["rating"] = nonNullRating
        }
        if let nonNullRuntime = self.runtime {
                dict["runtime"] = nonNullRuntime
        }
        if let nonNullReleaseDate = self.releaseDate {
                dict["releaseDate"] = nonNullReleaseDate
        }
        return dict as NSDictionary
    }
}
#endif
