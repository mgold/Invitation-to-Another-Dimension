# [Invitation to Another Dimension](http://maxgoldste.in/itad/)
**An Explorable Explanation by Max Goldstein**

An interactive essay about transforming many numbers at once according to simple rules.

If you find a bug, please open an issue.

## Run it locally
```
git clone git@github.com:mgold/Invitation-to-Another-Dimension.git
cd Invitation-to-Another-Dimension
npm install
```
Now fire up your favorite web server. As you develop, you'll want to have `gulp` running to take care of browserifying
the JS and compiling the SASS. You may also want to change out `d3.min.js` for `d3.v3.js` in `js/main.js`.

Although an attempt has been made to keep the code reasonably nice, it's a side project. Each stage follows the same
module pattern: expose a function that sets up a small amount of initial state, various constants and functions, and
returns a function that calls `render(true)` (indicating the initial render). Any time state is mutated thereafter, the
code responsible should call `render()`. As such, the diagrams aren't constantly reanimating. (Except the last one,
which is built on Mathbox.)
