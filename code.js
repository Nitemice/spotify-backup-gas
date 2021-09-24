const baseUrl = "https://api.spotify.com/v1";

// Data URLs
const profileUrl = baseUrl + "/me";
const followUrl = baseUrl + "/me/following";

const savedTracksUrl = baseUrl + "/me/tracks";
const savedAlbumsUrl = baseUrl + "/me/albums";
const savedShowsUrl = baseUrl + "/me/shows";
const savedEpisodesUrl = baseUrl + "/me/episodes";

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

    var pageObj = JSON.parse(firstPage);
    // Strip any outer shell, if there is one
    if (Object.values(pageObj).length == 1)
    {
        pageObj = Object.values(pageObj)[0];
    }

    // Retrieve URL for next page
    var nextPageUrl = pageObj["next"];
    while (nextPageUrl)
    {
        // Retrieve the next page
        nextPage = UrlFetchApp.fetch(nextPageUrl, options).getContentText();
        data.push(nextPage);

        // Retrieve URL for next page
        pageObj = JSON.parse(nextPage);
        // Strip any outer shell, if there is one
        if (Object.values(pageObj).length == 1)
        {
            pageObj = Object.values(pageObj)[0];
        }
        nextPageUrl = pageObj["next"];
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
    var filename = "following";
    if (config.outputFormat.includes("raw"))
    {
        var followingData = JSON.stringify(data, null, 4);
        common.updateOrCreateFile(config.backupDir, filename + ".json", followingData);
    }
    if (config.outputFormat.includes("csv"))
    {
        var csvData = "name, uri, follower count, genres\n";

        data.forEach(artist =>
        {
            var line = "\"" + artist.name + "\",";
            line += artist.uri + ",";
            line += artist.followers.total + ",";
            line += artist.genres.toString() + ",";
            csvData += line + "\n"
        });

        common.updateOrCreateFile(config.backupDir, filename + ".csv", csvData);
    }
}

function backupSavedTracks()
{
    // Retrieve auth
    var accessToken = retrieveAuth();

    // Retrieve data
    var params = "?limit=50";
    var data = getData(accessToken, savedTracksUrl + params, true);

    // Fold array of responses into single structure
    data = common.collateArrays("items", data);

    // Save to disk
    var filename = "savedTracks";
    if (config.outputFormat.includes("raw"))
    {
        var followingData = JSON.stringify(data, null, 4);
        common.updateOrCreateFile(config.backupDir, filename + ".json", followingData);
    }
    if (config.outputFormat.includes("csv"))
    {
        var csvData = "name, artist, album, track number, uri, date added\n";

        data.forEach(track =>
        {
            var line = "\"" + track.track.name + "\",";
            track.track.artists.forEach(artist =>
            {
                line += "\"" + artist.name + "\";";
    
            });
            line += ",";
            line += "\"" + track.track.album.name + "\",";
            line += track.track.track_number + ",";
            line += track.track.uri + ",";
            line += track.added_at + ",";
            csvData += line + "\n"
        });

        common.updateOrCreateFile(config.backupDir, filename + ".csv", csvData);
    }
}

function backupSavedAlbums()
{
    // Retrieve auth
    var accessToken = retrieveAuth();

    // Retrieve data
    var params = "?limit=50";
    var data = getData(accessToken, savedAlbumsUrl + params, true);

    // Fold array of responses into single structure
    data = common.collateArrays("items", data);

    // Save to disk
    var filename = "savedAlbums";
    if (config.outputFormat.includes("raw"))
    {
        var followingData = JSON.stringify(data, null, 4);
        common.updateOrCreateFile(config.backupDir, filename + ".json", followingData);
    }
    if (config.outputFormat.includes("csv"))
    {
        var csvData = "name, artist, uri, date added\n";

        data.forEach(album =>
        {
            var line = "\"" + album.album.name + "\",";
            album.album.artists.forEach(artist =>
            {
                line += "\"" + artist.name + "\";";

            });
            line += ",";
            line += album.album.uri + ",";
            line += album.added_at + ",";
            csvData += line + "\n"
        });

        common.updateOrCreateFile(config.backupDir, filename + ".csv", csvData);
    }
}

function backupSavedShows()
{
    // Retrieve auth
    var accessToken = retrieveAuth();

    // Retrieve data
    var params = "?limit=50";
    var data = getData(accessToken, savedShowsUrl + params, true);

    // Fold array of responses into single structure
    data = common.collateArrays("items", data);

    // Save to disk
    var filename = "savedShows";
    if (config.outputFormat.includes("raw"))
    {
        var followingData = JSON.stringify(data, null, 4);
        common.updateOrCreateFile(config.backupDir, filename + ".json", followingData);
    }
    if (config.outputFormat.includes("csv"))
    {
        var csvData = "name, publisher, uri, date added\n";

        data.forEach(show =>
        {
            var line = "\"" + show.show.name + "\",";
            line += "\"" + show.show.publisher + "\",";
            line += show.show.uri + ",";
            line += show.added_at + ",";
            csvData += line + "\n"
        });

        common.updateOrCreateFile(config.backupDir, filename + ".csv", csvData);
    }
}

function backupSavedEpisodes()
{
    // Retrieve auth
    var accessToken = retrieveAuth();

    // Retrieve data
    var params = "?limit=50";
    var data = getData(accessToken, savedEpisodesUrl + params, true);

    // Fold array of responses into single structure
    data = common.collateArrays("items", data);

    // Save to disk
    var filename = "savedEpisodes";
    if (config.outputFormat.includes("raw"))
    {
        var followingData = JSON.stringify(data, null, 4);
        common.updateOrCreateFile(config.backupDir, filename + ".json", followingData);
    }
    if (config.outputFormat.includes("csv"))
    {
        var csvData = "name, show, uri, date added\n";

        data.forEach(episode =>
        {
            var line = "\"" + episode.episode.name + "\",";
            line += "\"" + episode.episode.show.name + "\",";
            line += episode.episode.uri + ",";
            line += episode.added_at + ",";
            csvData += line + "\n"
        });

        common.updateOrCreateFile(config.backupDir, filename + ".csv", csvData);
    }
}

function backupSaved()
{
    backupSavedTracks();
    backupSavedAlbums();
    backupSavedShows();
    backupSavedEpisodes();
}


function main()
{
    backupProfile();
    backupFollowing();
    backupSaved();

    // Backup all playlists
}