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
    common.updateOrCreateFile(config.backupDir, filename, data);
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

    // Sort artists by name
    data.sort((first, second) =>
    {
        if (first.name < second.name)
        {
            return -1;
        }
        if (first.name > second.name)
        {
            return 1;
        }

        // names must be equal
        return 0;
    });

    // Save to disk
    if (config.outputFormat.includes("raw"))
    {
    var filename = "following.json";
    var followingData = JSON.stringify(data, null, 4);
        common.updateOrCreateFile(config.backupDir, filename, followingData);
    }
    if (config.outputFormat.includes("csv"))
    {
        var csvData = "name, uri, follower count, genres\n";

        data.forEach(artist =>
        {
            var line = artist.name + ",";
            line += artist.uri + ",";
            line += artist.followers.total + ",";
            line += artist.genres.toString() + ",";
            csvData += line + "\n"
        });

        var filename = "following.csv";
        common.updateOrCreateFile(config.backupDir, filename, csvData);
    }
}

function main()
{
    backupProfile();
    backupFollowing();

    // Backup all playlists
}