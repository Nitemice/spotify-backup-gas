const baseUrl = "https://api.spotify.com/v1";

// Profile URLs
const profileUrl = baseUrl + "/me";

// Library URLs
const followUrl = baseUrl + "/me/following";
const savedTracksUrl = baseUrl + "/me/tracks";
const savedAlbumsUrl = baseUrl + "/me/albums";
const savedShowsUrl = baseUrl + "/me/shows";
const savedEpisodesUrl = baseUrl + "/me/episodes";

// Playlist URLs
const playlistsUrl = baseUrl + "/me/playlists";

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

// Just a wrapper function to simplify some code
function xmlElement(type, text)
{
    return XmlService.createElement(type).setText(text);
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

    // Make a folder for playlist files
    var backupFolder = common.findOrCreateFolder(config.backupDir, "library").getId();

    // Save to disk
    var filename = "artists";
    if (config.outputFormat.includes("raw"))
    {
        var output = JSON.stringify(data, null, 4);
        common.updateOrCreateFile(backupFolder, filename + ".json", output);
    }
    if (config.outputFormat.includes("csv"))
    {
        var csvData = "name, uri, follower count, genres\n";

        data.forEach(artist =>
        {
            var line = JSON.stringify(artist.name) + ",";
            line += artist.uri + ",";
            line += artist.followers.total + ",";
            line += JSON.stringify(artist.genres.toString()) + ",";
            csvData += line + "\n"
        });

        common.updateOrCreateFile(backupFolder, filename + ".csv", csvData);
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

    // Make a folder for playlist files
    var backupFolder = common.findOrCreateFolder(config.backupDir, "library").getId();

    // Save to disk
    var filename = "likedTracks";
    if (config.outputFormat.includes("raw"))
    {
        var output = JSON.stringify(data, null, 4);
        common.updateOrCreateFile(backupFolder, filename + ".json", output);
    }
    if (config.outputFormat.includes("csv"))
    {
        var csvData = "name, artist, album, track number, uri, date added\n";

        data.forEach(track =>
        {
            var line = JSON.stringify(track.track.name) + ",";
            track.track.artists.forEach(artist =>
            {
                line += JSON.stringify(artist.name) + ";";

            });
            line = line.slice(0, -1) + ",";
            line += JSON.stringify(track.track.album.name) + ",";
            line += track.track.track_number + ",";
            line += track.track.uri + ",";
            line += track.added_at + ",";
            csvData += line + "\n"
        });

        common.updateOrCreateFile(backupFolder, filename + ".csv", csvData);
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

    // Make a folder for playlist files
    var backupFolder = common.findOrCreateFolder(config.backupDir, "library").getId();

    // Save to disk
    var filename = "albums";
    if (config.outputFormat.includes("raw"))
    {
        var output = JSON.stringify(data, null, 4);
        common.updateOrCreateFile(backupFolder, filename + ".json", output);
    }
    if (config.outputFormat.includes("csv"))
    {
        var csvData = "name, artist, uri, date added\n";

        data.forEach(album =>
        {
            var line = JSON.stringify(album.album.name) + ",";
            album.album.artists.forEach(artist =>
            {
                line += JSON.stringify(artist.name) + ";";

            });
            line = line.slice(0, -1) + ",";
            line += album.album.uri + ",";
            line += album.added_at + ",";
            csvData += line + "\n"
        });

        common.updateOrCreateFile(backupFolder, filename + ".csv", csvData);
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

    // Make a folder for playlist files
    var backupFolder = common.findOrCreateFolder(config.backupDir, "library").getId();

    // Save to disk
    var filename = "podcasts";
    if (config.outputFormat.includes("raw"))
    {
        var output = JSON.stringify(data, null, 4);
        common.updateOrCreateFile(backupFolder, filename + ".json", output);
    }
    if (config.outputFormat.includes("csv"))
    {
        var csvData = "name, publisher, uri, date added\n";

        data.forEach(show =>
        {
            var line = JSON.stringify(show.show.name) + ",";
            line += JSON.stringify(show.show.publisher) + ",";
            line += show.show.uri + ",";
            line += show.added_at + ",";
            csvData += line + "\n"
        });

        common.updateOrCreateFile(backupFolder, filename + ".csv", csvData);
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

    // Make a folder for playlist files
    var backupFolder = common.findOrCreateFolder(config.backupDir, "library").getId();

    // Save to disk
    var filename = "savedEpisodes";
    if (config.outputFormat.includes("raw"))
    {
        var output = JSON.stringify(data, null, 4);
        common.updateOrCreateFile(backupFolder, filename + ".json", output);
    }
    if (config.outputFormat.includes("csv"))
    {
        var csvData = "name, show, uri, date added\n";

        data.forEach(episode =>
        {
            var line = JSON.stringify(episode.episode.name) + ",";
            line += JSON.stringify(episode.episode.show.name) + ",";
            line += episode.episode.uri + ",";
            line += episode.added_at + ",";
            csvData += line + "\n"
        });

        common.updateOrCreateFile(backupFolder, filename + ".csv", csvData);
    }
}

function backupSaved()
{
    backupSavedTracks();
    backupSavedAlbums();
    backupSavedShows();
    backupSavedEpisodes();
}

function backupPlaylists()
{
    // Retrieve auth
    var accessToken = retrieveAuth();

    // Make a folder for all list files
    var backupFolder = common.findOrCreateFolder(config.backupDir, "playlists").getId();

    // Retrieve a list of all the lists
    var params = "?limit=50";
    var allPlaylists = getData(accessToken, playlistsUrl + params, true);
    allPlaylists = common.collateArrays("items", allPlaylists);

    // Save a list of playlists, in original order (folder order)
    var playlistList = allPlaylists.map(list => {return list.name});
    common.updateOrCreateFile(backupFolder, "playlists.txt", playlistList);

    // Iterate through the lists and retrieve each one
    for (list of allPlaylists)
    {
        // Retrieve playlist tracks
        var name = list.name + "_" + list.id;
        var tracks = getData(accessToken, list.tracks.href + params, true);
        tracks = common.collateArrays("items", tracks);
        list.tracks = tracks;

        if (config.outputFormat.includes("raw"))
        {
            // Save the json file in the indicated Google Drive folder
            var output = JSON.stringify(list, null, 4);
            common.updateOrCreateFile(backupFolder, filename + ".json", output);
        }

        if (config.outputFormat.includes("csv"))
        {
            var csvData = "name, artist, album, track number, uri, date added\n";

            tracks.forEach(track =>
            {
                var line = JSON.stringify(track.track.name) + ",";
                track.track.artists.forEach(artist =>
                {
                    line += JSON.stringify(artist.name) + ";";

                });
                line = line.slice(0, -1) + ",";
                line += JSON.stringify(track.track.album.name) + ",";
                line += track.track.track_number + ",";
                line += track.track.uri + ",";
                line += track.added_at + ",";
                csvData += line + "\n"
            });

            common.updateOrCreateFile(backupFolder, filename + ".csv", csvData);
        }

        if (config.outputFormat.includes("xspf"))
        {
            var ns = XmlService.getNamespace("http://xspf.org/ns/0/");
            var root = XmlService.createElement("playlist", ns)
                .setAttribute("version", "1");
            root.addContent(
                xmlElement("creator", list.owner.display_name));
            root.addContent(xmlElement("annotation", list.description));
            root.addContent(xmlElement("title", list.name));
            root.addContent(xmlElement("location", list.external_urls.spotify));
            root.addContent(xmlElement("identifier", list.uri));

            var trackList = XmlService.createElement("trackList");

            tracks.forEach(track =>
            {
                var trackElement = XmlService.createElement("track");
                trackElement.addContent(xmlElement("identifier", track.track.uri));
                trackElement.addContent(xmlElement("title", track.track.name));

                var artists = "";
                track.track.artists.forEach(artist =>
                {
                    artists += artist.name + ";";

                });
                artists = artists.slice(0, -1);
                trackElement.addContent(xmlElement("creator", artists));

                trackElement.addContent(
                    xmlElement("album", track.track.album.name));
                trackElement.addContent(
                    xmlElement("trackNum", track.track.track_number));
                trackElement.addContent(
                    xmlElement("meta", track.added_at)
                        .setAttribute("rel", "date_added"));
                if (track.track.external_urls.spotify)
                {
                    trackElement.addContent(
                        xmlElement("location", track.track.external_urls.spotify));
                }

                trackList.addContent(trackElement);
            });
            root.addContent(trackList);

            // Prepare XML for output
            var document = XmlService.createDocument(root);
            var output = XmlService.getPrettyFormat().format(document);
            common.updateOrCreateFile(backupFolder, filename + ".xspf", output);
        }
    }

}

function main()
{
    backupProfile();
    backupFollowing();
    backupSaved();
    backupPlaylists();
}