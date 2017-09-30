[![Build Status](https://secure.travis-ci.org/MorganConrad/gitdir.png)](http://travis-ci.org/MorganConrad/gitdir)
[![License](http://img.shields.io/badge/license-MIT-A31F34.svg)](https://github.com/MorganConrad/gitdir)
[![NPM Downloads](http://img.shields.io/npm/dm/gitdir.svg)](https://www.npmjs.org/package/gitdir)

# gitdir

Javascript / node.js code to read a single directory from a GitHub or GitLab repository.
All the files (not directories) and their contents, and returned in an array or map.

## basic usage

`var gitdir = require('gitdir');`
`gitdir(repositoryName, directory, options, callback);`

repositoryName combines the user and the repo, and the delimiter is important!
 * for GitHub use JohnDoe/CoolRepository
 * for GitLab, use JohnDoe%2FCoolRepository

e.g.   to read the root directory of the [Github npm](https://github.com/npm/npm) repository,
```javascript
   gitdir("npm/npm", "", {}, function(err, data) {
      // data contains an array of objects with file information
   });
```
For GitHub, the file information is similar to what you'd get from
https://api.github.com/repos/{repositoryName}/contents/

except:
  1. Only files (not dirs) are included
  2. A new field, "contents", has the contents of the file.


Example for a single file npm/npm/LICENSE  (contents truncated)

```
{
   "name": "LICENSE",
   "path": "LICENSE",
   "sha": "0b6c2287459632e4aaf63bd7d53eb9ba054b57ea",
   "size": 9742,
   "url": "https://api.github.com/repos/npm/npm/contents/LICENSE?ref=latest",
   "html_url": "https://github.com/npm/npm/blob/latest/LICENSE",
   "git_url": "https://api.github.com/repos/npm/npm/git/blobs/0b6c2287459632e4aaf63bd7d53eb9ba054b57ea",
   "download_url": "https://raw.githubusercontent.com/npm/npm/latest/LICENSE",
   "type": "file",
   "_links": {
      "self": "https://api.github.com/repos/npm/npm/contents/LICENSE?ref=latest",
      "git": "https://api.github.com/repos/npm/npm/git/blobs/0b6c2287459632e4aaf63bd7d53eb9ba054b57ea",
      "html": "https://github.com/npm/npm/blob/latest/LICENSE"
   },
   "contents": "The npm application\nCopyright (c) npm, Inc. ..."
}
```

For GitLab, the information is similar to what you'd get from
https://gitlab.com/api/v4/projects/{repositoryName}/repository/tree?private_token={options.private_token}&ref={options.branch}, with the addition of a contents and a download_url, which was used to fetch the contents.

e.g. gitlab-com%2Fwww-gitlab-com/LICENCE, you get:

```
{
   "id": "e186012554b42685b8e3b9bd52f3658f2d1d215c",
   "name": "LICENCE",
   "type": "blob",
   "path": "LICENCE",
   "mode": "100644",
   "download_url":"https://gitlab.com/api/v4/projects/gitlab-com%2Fwww-gitlab-com/repository/files/LICENCE/raw?private_token=&ref=master",
   "contents": "Copyright (c) GitLab B.V. \n"
}
```

## options (default in bold)

```
* gitlab, GitLab:   **false**
* body_key :        **"contents"**     name of the new key holding the file contents ("body")
* branch :          **"master"**       note - not used consistenly yet...
* fileFilter :      see below
* map :             **false**          if true, return a map (with key = path) instead of array of file information
* private_token :   **""**             needed if you are fetching a private repository
* recur :           **false**          not yet supported
* user_agent :      **"github.com/MorganConrad/gitdir"**   required for the API call, be polite
```

options.fileFilter:  determines which files will be included
 - if missing, include all files, except those ending in ".jar".
 - if a string or Regex, only include matching filePaths.
 - if a user-provided-function, include the file when `filter(filePath, fileInfo)` returns true.  _e.g._ If you want to use [multimatch](https://www.npmjs.com/package/multimatch)


 ### Caveats, TODOs

  1. the private_token is a security weakness, and, even worse, may appear in the results.  
   - Haven't tried it with GitHub cause I don't have any private repos there
   - For GitLab, you should use a more granular ["Personal Access Token"](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) instead.
  2. Branch isn't used consistently yet.
  3. Recursion into directories might be added later
