// Common GAS Functions
// v2.4.5 - 2024-12-11

var common = {

    // Retrieve file as JSON object
    grabJson: function(id)
    {
        var file = DriveApp.getFileById(id).getAs("application/json");
        return JSON.parse(file.getDataAsString());
    },

    // Write JSON object as string to file
    saveJson: function(id, content)
    {
        var file = DriveApp.getFileById(id);
        // Set the file contents
        file.setContent(JSON.stringify(content));
    },

    // Get a ref to given folder, or create one if it doesn't exist
    findOrCreateFolder: function(parentDir, foldername)
    {
        // See if there's already a folder in the indicated Google Drive folder
        var backupFolder = DriveApp.getFolderById(parentDir);
        var folders = backupFolder.getFoldersByName(foldername);

        if (folders.hasNext())
        {
            return folders.next();
        }
        else
        {
            // Create a new folder
            Logger.log("Created new folder: " + foldername);
            return backupFolder.createFolder(foldername);
        }
    },

    // Find file in folder, and delete it
    deleteFile: function(parentDir, filename)
    {
        // See if the indicated file is in the indicated Google Drive folder
        var folder = DriveApp.getFolderById(parentDir);
        var files = folder.getFilesByName(filename);
        if (files.hasNext())
        {
            files.next().setTrashed(true);
            Logger.log("Deleted file: " + filename);
        }
    },

    // Get a ref to given file, or create one if it doesn't exist
    findOrCreateFile: function(parentDir, filename, newContent = "")
    {
        // See if there's already a file in the indicated Google Drive folder
        var folder = DriveApp.getFolderById(parentDir);
        var files = folder.getFilesByName(filename);
        if (files.hasNext())
        {
            return files.next();
        }
        else
        {
            // Create a new empty file
            Logger.log("Created file: " + filename);
            return folder.createFile(filename, newContent);
        }
    },

    // Write to file, only if different to existing content
    updateOrCreateFile: function(parentDir, filename, content)
    {
        var file = common.findOrCreateFile(parentDir, filename);

        // Check if the contents already matches
        if (file.getBlob().getDataAsString() != content)
        {
            // Set the file contents
            file.setContent(content);
            Logger.log("Updated file: " + filename);
        }
        return file;
    },

    // Append to file content
    appendOrCreateFile: function(parentDir, filename, newContent)
    {
        var file = common.findOrCreateFile(parentDir, filename);

        // Retrieve existing file content
        var content = file.getBlob().getDataAsString();
        content += newContent;

        // Set the file contents
        file.setContent(content);
        Logger.log("Updated file: " + filename);

        return file;
    },

    // Write blob to file
    updateOrCreateBlobFile: function(parentDir, filename, content)
    {
        // Start off by deleting any old file with the same name
        common.deleteFile(parentDir, filename);

        // Create a new file, with the new contents
        var folder = DriveApp.getFolderById(parentDir);
        var newFile = folder.createFile(content);
        newFile.setName(filename);
        Logger.log("Updated file: " + filename);
        return newFile;
    },

    // Parse URL path parameters
    parsePathParameters: function(request)
    {
        // If there's only one parameter, just treat it as a path
        if (!request.queryString.match(/\=/))
        {
            return request.queryString;
        }

        // Look for a parameter called "path"
        return request.parameter.path || "";
    },

    // Strip spaces, no-break spaces, zero-width spaces,
    // & zero-width no-break spaces
    trim: function(string)
    {
        var pattern = /(^[\s\u00a0\u200b\uFEFF]+)|([\s\u00a0\u200b\uFEFF]+$)/g;
        return string.replace(pattern, "");
    },

    // Convert a JSON string to a pretty-print JSON string
    prettyPrintJsonStr: function(input)
    {
        return JSON.stringify(JSON.parse(input), null, 4);
    },

    // Collate objects at given path, from array of JSON strings
    collateArrays: function(path, objects, ignoreNulls = false)
    {
        var outArray = [];
        var chunks = path.split('.');

        // Iterate over each object
        for (const resp of objects)
        {
            var obj = JSON.parse(resp);
            for (const chunk of chunks)
            {
                obj = obj[chunk];
            }

            if (ignoreNulls) {
                obj = obj.filter((value) => value != null)
            }
            outArray = outArray.concat(obj);
        }

        return outArray;
    },

    // Covert an array into a map, which can be used for tallying
    arrayToCountMap: function(array, defaultCount = 0)
    {
        var output = new Map();
        array.forEach(element =>
        {
            output.set(element, defaultCount);
        });
        return output;
    },

    // Parse UNIX Epoch time, into 
    epochToIso: function(seconds)
    {
        var date = new Date(0);
        date.setUTCSeconds(seconds);
        return date.toISOString()
    },
};
