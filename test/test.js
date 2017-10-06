var test = require('tape');
var gitdir = require('../gitdir.js');

function done(err) { if (err) throw err; }

test('github', function(t) {
   gitdir("npm/npm", "", {map: true}, function(err, data) {
      if (err) {
         console.log("Error : "  + JSON.stringify(err));
         t.fail(err);
      }
      else {
         //console.log(JSON.stringify(data, null, 2));
         t.true(data.LICENSE.contents.startsWith("The npm application"));
         t.equals("README.md", data["README.md"].name)
      }

      t.end();
   });

});

test('gitlab with body_key = zqx3 and keepAll', function(t) {
   gitdir("gitlab-com%2Fwww-gitlab-com", "",
      { map: true,
        gitlab: true,
        body_key:"zqx3",   // try some of the options...
        keepAll: true,
        deleteDownloadURL: true},
      function(err, data) {
         if (err) {
            console.log("Error : "  + JSON.stringify(err));
            t.fail(err);
         }
         else {
            // console.log(JSON.stringify(data, null, 2));
            t.true(data.LICENCE.zqx3.startsWith("Copyright (c) GitLab B.V."));  // tests body_key
            t.equals("tree", data.bin.type);           // tests keepAll
            t.equals("README.md", data["README.md"].name);
            t.false(data.LICENCE.download_url);  // test deleteDownloadURL
         }

      t.end();
   });

});
