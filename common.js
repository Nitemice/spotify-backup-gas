// Common GAS Functions
// v2.2.0 - 2021-10-04

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

    // Retrieve text from inside XML tags
    stripXml: function(input)
    {
        // Only parse input if it looks like it contains tags
        if (input.match(/<[^>]*>/))
        {
            // Find where the tags start & end
            var start = input.indexOf('<');
            var end = input.lastIndexOf('>') + 1;

            // Grab any text before all XML tags
            var pre = input.slice(0, start);
            // Grab any text after all XML tags
            var post = input.slice(end);
            var inside = "";

            try
            {
                // Parse input without any pre or post text
                var cleanInput = input.slice(start, end);

                var doc = XmlService.parse(cleanInput);
                inside = doc.getRootElement().getText();
            }
            catch (error)
            {
                Logger.log(input + " = " + error);
            }

            return pre + inside + post;
        }
        return input;
    },

    // Convert a JSON string to a pretty-print JSON string
    prettyPrintJsonStr: function(input)
    {
        return JSON.stringify(JSON.parse(input), null, 4);
    },

    // Collate objects at given path, from array of JSON strings
    collateArrays: function(path, objects)
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
            outArray = outArray.concat(obj);
        }

        return outArray;
    },
};
