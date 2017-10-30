[![Build Status](https://secure.travis-ci.org/MorganConrad/gitdir.png)](http://travis-ci.org/MorganConrad/gitdir)
[![License](http://img.shields.io/badge/license-MIT-A31F34.svg)](https://github.com/MorganConrad/gitdir)
[![NPM Downloads](http://img.shields.io/npm/dm/gitdir.svg)](https://www.npmjs.org/package/gitdir)
[![Known Vulnerabilities](https://snyk.io/test/github/morganconrad/gitdir/badge.svg)](https://snyk.io/test/github/morganconrad/gitdir)
[![Coverage Status](https://coveralls.io/repos/github/MorganConrad/gitdir/badge.svg)](https://coveralls.io/github/MorganConrad/gitdir)
# gitdir

Javascript / node.js code to read a single directory from a GitHub or GitLab repository.  All the files (not directories) and their contents, are returned in an array or map.  Useful if you want to grab a small part of some external repository for your project.

## basic usage

```
var gitdir = require('gitdir');
...
gitdir(repositoryName, directory, options, callback);
```

**repositoryName** combines the user and the repo, and the delimiter is important!
 * for GitHub use `JohnDoe/CoolRepository`
 * for GitLab, use `JohnDoe%2FCoolRepository`

e.g.   to read the root directory of the [Github npm](https://github.com/npm/npm) repository,
```javascript
   gitdir("npm/npm", "", {}, function(err, data) {
      // data contains an array of objects with file information
   });
```
For GitHub, the file information is similar to what you'd get from [Get Contents](https://developer.github.com/v3/repos/contents/#get-contents)

_e.g._ https://api.github.com/repos/{repositoryName}/contents/

except:
  1. Usually only files (not dirs) are included (see **options.keepAll** below)
  2. A new field, "contents", has the contents of the file.


Example for a single file `npm/npm/LICENSE`  (contents truncated for this example)

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

For GitLab, the information is similar to what you'd get from [List repository tree](https://docs.gitlab.com/ce/api/repositories.html#list-repository-tree)

_e.g._ https://gitlab.com/api/v4/projects/{repositoryName}/repository/tree?private_token={options.private_token}&ref={options.branch}, with the addition of a contents and a download_url, which was used to fetch the contents.

e.g. `gitlab-com%2Fwww-gitlab-com/LICENCE`, you get:

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

## Options

|Option | Default | Notes |
|:------|:--------|:------|
|gitlab, GitLab    | false| false => GitHub|
|body_key          | "contents" | name of the new key holding the file contents ("body") |
|blob              | false    | GitLab only.  Get content from [blob](https://docs.gitlab.com/ce/api/repositories.html#get-a-blob-from-repository) `blobs/:sha` instead of [raw file](https://docs.gitlab.com/ce/api/repository_files.html#get-raw-file-from-repository) `files/:file_path`
|branch            | "master" | note - not tested much yet...|
|deleteDownloadURL | false    | delete the download URL from the data, in case in contains a private_token |
|fileFilter        | null     | see below|
|gitlab_API_root   | "https://gitlab.com/api/v4" | change if you have your own GitLab server |
|github_API_root   | "https://api.github.com" | change if you have your own GitHub server |
|keepAll           | false    | keep all results (including directories).  Normally only files are kept. |
|map               |  false   | if true, return a map (with key = path) instead of array of file information |
|private_token     |  ""      | needed if you are fetching a private repository |
|recur             |  false   |  not yet supported |
|user_agent        | "github.com/MorganConrad/gitdir" | required for the API call, be polite |



**options.fileFilter** determines which files will be included
 - if missing, include all files, except those ending in ".jar".
 - if a string or Regex, only include matching filePaths.
 - if a user-provided-function, include the file when `filter(filePath, fileInfo)` returns true.  _e.g._ If you want to use [multimatch](https://www.npmjs.com/package/multimatch)


### Caveats, TODOs

  1. the private_token is a security weakness, and, even worse, may appear in the results.
   - You should probably use the deleteDownloadURL option.
   - Haven't tried it with GitHub cause I don't have any private repos there.
   - For GitLab, you should use a more granular ["Personal Access Token"](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) instead.
  2. Branch isn't well tested.
  3. Recursion into directories might be added later.
  4. Not sure about encoding for non-text contents.
