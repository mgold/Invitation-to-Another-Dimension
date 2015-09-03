# [Invitation to Another Dimension](http://maxgoldste.in/itad/)
**An Explorable Explanation by Max Goldstein**

An interactive essay about transforming many numbers at once according to simple rules.

If you find a bug, please open an issue.

## Run it locally
```shell
git clone git@github.com:mgold/Invitation-to-Another-Dimension.git
cd Invitation-to-Another-Dimension
npm install
node node_modules/gulp/bin/gulp.js sass browserify
```
Now fire up your favorite web server.

Although an attempt has been made to keep the code reasonably nice, it's a side project. Each stage follows the same
module pattern: expose a function that sets up a small amount of initial state, various constants and functions, and
returns a function that calls `render(true)` (indicating the initial render). Any time state is mutated thereafter, the
code responsible should call `render()`. As such, the diagrams aren't constantly reanimating. (Except the last one,
which is built on Mathbox.)
