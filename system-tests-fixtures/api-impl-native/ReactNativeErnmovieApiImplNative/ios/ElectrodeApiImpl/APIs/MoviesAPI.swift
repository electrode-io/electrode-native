public class MoviesAPI: NSObject  {

    static let kRequestGetMovieDetail = "com.ernmvoie.ern.api.request.getMovieDetail";

    static let kRequestGetTopRatedMovies = "com.ernmvoie.ern.api.request.getTopRatedMovies";


    public lazy var requests: MoviesAPIRequests = {
        return MoviesRequests()
    }()
}


public class MoviesAPIRequests: NSObject {
    public func registerGetMovieDetailRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) {
        assertionFailure("should override")
    }

    public func registerGetTopRatedMoviesRequestHandler(handler: @escaping ElectrodeBridgeRequestCompletionHandler) {
        assertionFailure("should override")
    }

    public func getMovieDetail(movieId: String, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

    public func getTopRatedMovies(responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        assertionFailure("should override")
    }

}
