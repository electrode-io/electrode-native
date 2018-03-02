
public class MoviesRequests: MoviesAPIRequests {

    public override func registerGetMovieDetailRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) {
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: MoviesAPI.kRequestGetMovieDetail,
    reqClass: String.self, 
    respClass: AnyObject.self,
    requestCompletionHandler: handler)
        requestHandlerProcessor.execute()
    }

    public override func registerGetTopRatedMoviesRequestHandler(handler:  @escaping ElectrodeBridgeRequestCompletionHandler) {
        let requestHandlerProcessor = ElectrodeRequestHandlerProcessor(requestName: MoviesAPI.kRequestGetTopRatedMovies,
    reqClass: None.self, 
    respClass: [Movie].self,
    requestCompletionHandler: handler)
        requestHandlerProcessor.execute()
    }

    //------------------------------------------------------------------------------------------------------------------------------------


    public override func getMovieDetail(movieId: String, responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        let requestProcessor = ElectrodeRequestProcessor<String, AnyObject, Any>(
            requestName: MoviesAPI.kRequestGetMovieDetail,
            requestPayload: movieId,
            respClass: AnyObject.self,
            responseItemType: nil,
            responseCompletionHandler: responseCompletionHandler)

        requestProcessor.execute()
    }

    public override func getTopRatedMovies( responseCompletionHandler: @escaping ElectrodeBridgeResponseCompletionHandler) {
        let requestProcessor = ElectrodeRequestProcessor<None, [Movie], Any>(
            requestName: MoviesAPI.kRequestGetTopRatedMovies,
            requestPayload: nil, 
            respClass: [Movie].self,
            responseItemType: Movie.self,
            responseCompletionHandler: responseCompletionHandler)

        requestProcessor.execute()
    }
}