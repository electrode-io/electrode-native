#if swift(>=4.0)
@objcMembers public class MoviesAPI: NSObject  {

    static let kRequestGetMovieDetail = "com.ernmovie.ern.api.request.getMovieDetail";

    static let kRequestGetTopRatedMovies = "com.ernmovie.ern.api.request.getTopRatedMovies";


    public lazy var requests: MoviesAPIRequests = {
        return MoviesRequests()
    }()
}


@objcMembers public class MoviesAPIRequests: NSObject {
    public func registerGetMovieDetailRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID?{
        assertionFailure("should override")
        return UUID()
    }

    public func registerGetTopRatedMoviesRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID?{
        assertionFailure("should override")
        return UUID()
    }


    public func unregisterGetMovieDetailRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        assertionFailure("should override")
        return nil
    }

    public func unregisterGetTopRatedMoviesRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        assertionFailure("should override")
        return nil
    }


    public func getMovieDetail(movieId: String, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

    public func getTopRatedMovies(responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

}
#else
public class MoviesAPI: NSObject  {

    static let kRequestGetMovieDetail = "com.ernmovie.ern.api.request.getMovieDetail";

    static let kRequestGetTopRatedMovies = "com.ernmovie.ern.api.request.getTopRatedMovies";


    public lazy var requests: MoviesAPIRequests = {
        return MoviesRequests()
    }()
}


public class MoviesAPIRequests: NSObject {
    public func registerGetMovieDetailRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID?{
        assertionFailure("should override")
        return UUID()
    }

    public func registerGetTopRatedMoviesRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) -> UUID?{
        assertionFailure("should override")
        return UUID()
    }


    public func unregisterGetMovieDetailRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        assertionFailure("should override")
        return nil
    }

    public func unregisterGetTopRatedMoviesRequestHandler(uuid: UUID) -> ElectrodeBridgeRequestCompletionHandler? {
        assertionFailure("should override")
        return nil
    }


    public func getMovieDetail(movieId: String, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

    public func getTopRatedMovies(responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

}

#endif
