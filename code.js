const baseUrl = "https://api.spotify.com/v1";

// Data URLs
const profileUrl = baseUrl + "/me";
const followUrl = baseUrl + "/me/following";

function getData(accessToken, url, getAllPages = false)
{
    var headers = {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json"
    };

    var options = {
        "muteHttpExceptions": true,
        "headers": headers
    };

    var firstPage = UrlFetchApp.fetch(url, options).getContentText();

    // Bail out if we only wanted the first page
    if (!getAllPages)
    {
        return firstPage;
    }

    // Put first page in array for return with following pages
    var data = [firstPage];

    // Retrieve URL for next page
    var pageObj = Object.values(JSON.parse(firstPage));
    var nextPageUrl = pageObj[0]["next"];
    while (nextPageUrl)
    {
        nextPage = UrlFetchApp.fetch(nextPageUrl, options).getContentText();
        data.push(nextPage);
        pageObj = Object.values(JSON.parse(nextPage));
        nextPageUrl = pageObj[0]["next"];
    }

    return data;
}

function backupProfile()
{
    // Retrieve auth
    var accessToken = retrieveAuth();

    // Retrieve data
    var data = getData(accessToken, profileUrl);

    // Save to disk
    var filename = "profile.json";
    var file = common.updateOrCreateFile(config.backupDir, filename, data);
}

function backupFollowing()
{
    // Retrieve auth
    var accessToken = retrieveAuth();

    // Retrieve data
    var params = "?type=artist&limit=50";
    var data = getData(accessToken, followUrl + params, true);

    // Fold array of responses into single structure
    data = common.collateArrays("artists.items", data);

    // Save to disk
    var filename = "following.json";
    var followingData = JSON.stringify(data, null, 4);
    var file = common.updateOrCreateFile(config.backupDir, filename, followingData);
}

function main()
{
    backupProfile();
    backupFollowing();

    // Backup all playlists
}