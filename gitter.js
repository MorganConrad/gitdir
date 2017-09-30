module.exports = gitter;

const Request = require("request");

const defaults = {
   body_key : "contents",
   user_agent : "github.com/MorganConrad/gitter",
   branch : "master",
   private_token : ""
 };

var options = null;


/**
 * [gitter description]
 * @param  {[String]}   repo        User/Repo for GitHub,  User%2FRepo for GitLab
 * @param  {[String]}   subdir      subdirectory, e.g. "test"
 * @param  {[object]}   userOptions see README.md
 * @param  {Function} callback      standard callback(error, data)
*/
function gitter(repo, subdir, userOptions, callback) {
   subdir = subdir || "";
   options = normalize(userOptions);

   if (options.gitlab || options.GitLab)
      gitlabDir(repo, subdir, callback);
   else
      githubDir(repo, subdir, callback);
}


function githubDir(repo, subdir, callback) {

   var url = `https://api.github.com/repos/${repo}/contents/${subdir}?ref=${options.branch}`;

   requestPF( url )
      .then(parseAndFilterGithubDirectoryInfoPF)
      .then(getFileDataPF)
      .then(convertToMap)
      .then(function(data) {
         callback(null, data);
      })
      .catch(function(err) {
         callback(err);
      });
}


function gitlabDir(repo, subdir, callback) {
   var url = `https://gitlab.com/api/v4/projects/${repo}/repository/tree?private_token=${options.private_token}&ref=${options.branch}`;

   options.repo = repo;  // ick
   options.subdir = subdir;

   requestPF(url)
      .then(parseAndFilterGitlabDirectoryInfoPF)
      .then(getFileDataPF)
      .then(convertToMap)
      .then(function(data) {
         callback(null, data);
      })
      .catch(function(err) {
         callback(err);
      });
}


/**
 * Request Promise Factory
 * @param  url
 * @return A Promise, resolving to the body of the response
 */
function requestPF(url) {
   params = {
      url : url,
      headers: {
         'User-Agent': options.user_agent
      }
   };

   return new Promise( function(resolve, reject) {
      Request.get(params, function(error, response, body) {
         if (error)
            reject(error);
         else if (response.statusCode !== 200)
            reject(`${params.url} : ${response.statusCode} ${response.statusMessage}`);
         else
            resolve(body);
      });
   });
}


/**
 * Parse Raw JSON from initial GitHub request, then filter into array of file information
 * Promise Factory - returns a Promise
 * @param  rawJson
 * @return A Promise, resolving to the parsed array
 */
function parseAndFilterGithubDirectoryInfoPF(rawJson) {
   var filesInfo = [];
   var repoinfo = JSON.parse(rawJson);
   for (var fileinfo of repoinfo) {
      if ( (fileinfo.type === "file") &&
            options.fileFilter(fileinfo.path) &&
            fileinfo.download_url
         ) {
            filesInfo.push( fileinfo );
         }
      else if ( options.recur &&
               (fileinfo.type === "dir")) {
                  throw "recur not supported yet";
               }
   }

   return Promise.resolve(filesInfo);
}


/**
 * Parse Raw JSON from initial GitLab request, then filter into array of file information
 * Promise Factory - returns a Promise
 * @param  rawJson
 * @return A Promise, resolving to the parsed array
 */
function parseAndFilterGitlabDirectoryInfoPF(rawJson) {
   var filesInfo = [];
   var repoinfo = JSON.parse(rawJson);
   for (var fileinfo of repoinfo) {
      if ( (fileinfo.type === "blob") &&
            options.fileFilter(fileinfo.path)
         ) {
            fileinfo.download_url = `https://gitlab.com/api/v4/projects/${options.repo}/repository/files/${fileinfo.path}/raw?private_token=${options.private_token}&ref=${options.branch}`;
            filesInfo.push( fileinfo );
         }
      else if ( options.recur &&
               (fileinfo.type === "tree")) {
                  throw "recur not supported yet";
               }
   }

   return Promise.resolve(filesInfo);
}



/**
 * Retrieve file contents for an array of files
 * Creates an array of requestPFs, then calls Promise.add()
 * Promise Factory - returns a Promise
 * @param  {[array]} filesInfo [description]
 * @return A Promise, resolving to an array of the original file information, plus file contents added
*/
function getFileDataPF(filesInfo) {
   var downloadRequests = [];
   for (let fileInfo of filesInfo)
      downloadRequests.push(
         requestPF(fileInfo.download_url)
            .then(function(body) {
                fileInfo[options.body_key] = body;
                return fileInfo;
            })
      );

   return Promise.all(downloadRequests);
}


/**
 * Convert array of file information to a map (if options.map is set)
 * @param  {[type]} arrayData [description]
 * @return A Promise, resolving to an array or map
 */
function convertToMap(arrayData) {
   if (options.map) {
      var map = {};
      for (var datum of arrayData)
         map[datum.path] = datum;

      return Promise.resolve(map);
   }
   else {
      return Promise.resolve(arrayData);
   }
}


function normalize(userOptions){
   userOptions = userOptions || { };
   var options = Object.assign({}, defaults, userOptions);
   options.fileFilter = fileFilter(options.fileFilter);

   return options;
};


/* calculate file filter function */
function fileFilter(filter) {
  if (filter) {
     if (typeof filter === 'string') {
        var regex = new RegExp(filter);
        return function(filePath) { return regex.test(filePath); }
     }
     else if (filter instanceof RegExp)
        return function(filePath) { return filter.test(filePath); }
     else {   // must be a function itself
        return filter;
     }
   }
   else  // none, return "pass all"
      return function(filePath) { return !filePath.endsWith(".jar"); };
}
