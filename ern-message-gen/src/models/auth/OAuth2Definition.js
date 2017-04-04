import AbstractSecuritySchemeDefinition from "./AbstractSecuritySchemeDefinition";
import {newHashMap, asMap} from "../../java/javaUtil";

export default class OAuth2Definition extends AbstractSecuritySchemeDefinition {
    static TYPE = "oauth2";
    type = OAuth2Definition.TYPE;


    implicit(authorizationUrl) {
        this.setAuthorizationUrl(authorizationUrl);
        this.setFlow("implicit");
        return this;
    };

    password(tokenUrl) {
        this.setTokenUrl(tokenUrl);
        this.setFlow("password");
        return this;
    };

    application(tokenUrl) {
        this.setTokenUrl(tokenUrl);
        this.setFlow("application");
        return this;
    };

    accessCode(authorizationUrl, tokenUrl) {
        this.setTokenUrl(tokenUrl);
        this.setAuthorizationUrl(authorizationUrl);
        this.setFlow("accessCode");
        return this;
    };

    scope(name, description) {
        this.addScope(name, description);
        return this;
    };

    getAuthorizationUrl() {
        return this.authorizationUrl;
    };

    setAuthorizationUrl(authorizationUrl) {
        this.authorizationUrl = authorizationUrl;
    };

    getTokenUrl() {
        return this.tokenUrl;
    };

    setTokenUrl(tokenUrl) {
        this.tokenUrl = tokenUrl;
    };

    getFlow() {
        return this.flow;
    };

    setFlow(flow) {
        this.flow = flow;
    };

    getScopes() {
        return this.scopes;
    };

    setScopes(scopes) {
        this.scopes = asMap(scopes);
    };

    addScope(name, description) {
        if (this.scopes == null) {
            this.scopes = newHashMap();
        }
        this.scopes.put(name, description);
    };



    toJSON() {
        return Object.assign(super.toJSON(), {
            type: this.type,
            scopes: this.scopes,
            flow: this.flow,
            tokenUrl: this.tokenUrl,
            authorizationUrl: this.authorizationUrl
        })
    }

}
