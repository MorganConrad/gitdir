var test = require('tape');
var gitter = require('../gitter.js');

function done(err) { if (err) throw err; }

test('github', function(t) {
   gitter("npm/npm", "", {map: true}, function(err, data) {
      if (err) {
         console.log("Error : "  + err);
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

test('gitlab', function(t) {
   gitter("gitlab-com%2Fwww-gitlab-com", "", {map: true, gitlab: true}, function(err, data) {
      if (err) {
         console.log("Error : "  + err);
         t.fail(err);
      }
      else {
         //console.log(JSON.stringify(data, null, 2));
         t.true(data.LICENCE.contents.startsWith("Copyright (c) GitLab B.V."));
         t.equals("README.md", data["README.md"].name)
      }

      t.end();
   });

});
