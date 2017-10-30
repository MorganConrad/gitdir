module.exports = gitdir;

const MRP = require("minimal-request-promise");

const DEFAULT_OPTIONS = {
   body_key : "contents",
   branch : "master",
   private_token : "",
   user_agent : "github.com/MorganConrad/gitdir",

   gitlab_API_root : "https://gitlab.com/api/v4",
   github_API_root : "https://api.github.com"

   /* options that default to false or null
   GitLab (or gitlab)  if false, it's GitHub
   keepAll             keep all results (including directories)  Normally only files are kept.
   deleteDownloadURL   delete the download URL from the data, in case in contains a private_token
   recur               reserved, not supported yet
   */
};

var options = null;

/** for complete details
 * @see https://github.com/MorganConrad/gitdir for more details
 *
 * @param  {[String]}   repo        User/Repo for GitHub,  User%2FRepo for GitLab
 * @param  {[String]}   subdir      subdirectory, e.g. "test", default is ""
 * @param  {[object]}   userOptions see DEFAULT_OPTIONS and README.md
 * @param  {Function}   callback    standard callback(error, data)
*/
function gitdir(repo, subdir, userOptions, callback) {
   subdir = subdir || "";
   options = normalize(userOptions);

   options.repo = repo;  // needed for later generateGitLabDownloadURL call...
   options.subdir = subdir;

   var repositoryUrl = options.GitLab ?
      `${options.gitlab_API_root}/projects/${repo}/repository/tree?private_token=${options.private_token}&ref=${options.branch}` :
      `${options.github_API_root}/repos/${repo}/contents/${subdir}?ref=${options.branch}`;

   MRP.get( repositoryUrl, options.MRPOptions )
      .then(parseAndFilterDirectoryInfoPF)
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
 * Parse Raw JSON from initial request, then filter into array of file information
 * Promise Factory - returns a Promise
 * @param  {[object]} response containing the rawJson
 * @return A Promise, resolving to the parsed array
 */

function parseAndFilterDirectoryInfoPF(response) {
   var filesInfo = [];
   var repoinfo = JSON.parse(response.body);
   var fileType = options.GitLab ? "blob" : "file";
   for (let fileinfo of repoinfo) {
      if (options.fileFilter(fileinfo.path)) {
         if (fileinfo.type === fileType) {
            if (options.GitLab)  // note: GitHub already has a download_url
               fileinfo.download_url = generateGitLabDownloadURL(fileinfo, options);
            filesInfo.push( fileinfo );
         }
         else if (options.keepAll) {
            filesInfo.push( fileinfo );
         }
      }
   }

   return Promise.resolve(filesInfo);
}


/**
 * Retrieve file contents for an array of files
 * Creates an array of requestPFs, then calls Promise.all()
 * Promise Factory - returns a Promise
 * @param  {[array]} filesInfo info from initial request, plus (possibly) download_url
 * @return A Promise, resolving to an array of the original file information, plus file contents added
*/
function getFileDataPF(filesInfo) {
   var downloadRequests = [];
   for (let fileInfo of filesInfo) {
      if (fileInfo.download_url) {
         downloadRequests.push(
            MRP.get(fileInfo.download_url, options.MRPOptions)
               .then(function(response) {
                  fileInfo[options.body_key] = response.body;  // TODO encoding???
                  if (options.deleteDownloadURL)
                     delete fileInfo.download_url;
                  return fileInfo;
               })
         );
      }
      else {
         downloadRequests.push(fileInfo);
      }
   }

   return Promise.all(downloadRequests);
}


function generateGitLabDownloadURL(fileinfo, options) {
   var commonStart = `${options.gitlab_API_root}/projects/${options.repo}/repository/`;
   var commonEnd = `/raw?private_token=${options.private_token}&ref=${options.branch}`;
   var variableMiddle = options.blob ? `blobs/${fileinfo.id}` : `files/${fileinfo.path}`;
   return commonStart + variableMiddle + commonEnd;
}

/**
 * Convert array of file information to a map (if options.map is set)
 * @param  {[array]} arrayData the final results
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


// process user options
function normalize(userOptions){
   var options = Object.assign({}, DEFAULT_OPTIONS, userOptions || {} );
   options.MRPOptions = {
      method: 'GET',
      headers: {
         "User-Agent" : options.user_agent
      }
   };
   options.fileFilter = fileFilter(options.fileFilter);
   options.GitLab = options.gitlab || options.GitLab;

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
   else
      return function(filePath) { return !filePath.endsWith(".jar"); };
}
