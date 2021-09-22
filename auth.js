// Authentication URLs
const baseAuthUrl = "https://accounts.spotify.com";
const authUrl = baseAuthUrl + "/authorize";
const refreshUrl = baseAuthUrl + "/api/token";

const scope = "user-read-private user-read-email user-follow-read playlist-read-private playlist-read-collaborative";

function doGet(e)
{
    if (e.parameter.error)
    {
        var template = HtmlService.createTemplateFromFile("auth_error");
        template.errorText = e.parameter.error;

        return template.evaluate();
    }
    else if (!e.parameter.code)
    {
        return HtmlService.createTemplateFromFile("auth_steps").evaluate();
    }

    // Retrieve refreshable auth with auth code
    // Then store it for later
    var authInfo = getFreshAuth(e.parameter.code);
    storeAuth(authInfo);

    return HtmlService.createTemplateFromFile("auth_success").evaluate();
}

function generateAuthUrl()
{
    // Generate URL for requesting authorization
    // Using Authorization Code Flow
    var url = ScriptApp.getService().getUrl();
    var params = "?response_type=code&client_id=" + config.clientId
        + "&scope=" + scope + "&redirect_uri=" + url;

    return authUrl + encodeURI(params);
}

function getFreshAuth(code)
{
    // Retrieve refreshable auth info

    // Request refresh token
    var payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": ScriptApp.getService().getUrl(),
        "client_id": config.clientId,
        "client_secret": config.clientSecret,
    };

    var options = {
        'method': 'post',
        'Content-Type': 'application/json',
        'payload': payload
    };

    var response = UrlFetchApp.fetch(refreshUrl, options);

    // Grab the values we're looking for and return them
    var newTokens = JSON.parse(response.getContentText());
    var authInfo = new Object();

    authInfo.accessToken = newTokens.access_token;
    authInfo.refreshToken = newTokens.refresh_token;
    var now = Date.now() / 1000;
    authInfo.expiry = now + newTokens.expires_in;
    return authInfo;
}

function refreshAuth(refreshToken)
{
    // Refresh auth info with refresh token

    // Request refreshed tokens
    var payload = {
        "grant_type": "refresh_token",
        "refresh_token": refreshToken,
        "client_id": config.clientId,
        "client_secret": config.clientSecret,
    };

    var options = {
        'method': 'post',
        'Content-Type': 'application/json',
        'payload': payload
    };

    var response = UrlFetchApp.fetch(refreshUrl, options);

    // Grab the values we're looking for and return them
    var newTokens = JSON.parse(response.getContentText());
    var authInfo = new Object();

    authInfo.accessToken = newTokens.access_token;
    authInfo.refreshToken = newTokens.refresh_token;
    var now = Date.now() / 1000;
    authInfo.expiry = now + newTokens.expires_in;
    return authInfo;
}

function storeAuth(authInfo)
{
    // Retrieve refreshable auth info from user properties store
    var userProperties = PropertiesService.getUserProperties();

    // Save the new auth info back to the user properties store
    userProperties.setProperties(authInfo);
}

function retrieveAuth()
{
    // Retrieve refreshable auth info from user properties store
    var userProperties = PropertiesService.getUserProperties();
    var authInfo = userProperties.getProperties();

    // Check if auth info is there
    if (!authInfo.hasOwnProperty("refreshToken") ||
        !authInfo.hasOwnProperty("accessToken"))
    {
        // First-time auth missing.
        // Needs to be manually authorised.
        throw "No access/refresh token. You need to deploy & run first-time authentication.";
    }

    // Check if the auth token has expired yet
    var now = Date.now() / 1000;
    if (now > authInfo.expiry)
    {
        // Refresh the auth info
        Logger.log("Access token expired. Refreshing authentication...");
        authInfo = refreshAuth(authInfo.refreshToken);

        // Save the new auth info back to the user properties store
        userProperties.setProperties(authInfo);
    }

    // Return just what we need for retrieving data
    return authInfo.accessToken;
}