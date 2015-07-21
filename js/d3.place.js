/* d3.selection.place()  -  an unofficial add-on
Place one item of the given tag and class (as "tag.class") into the DOM, unless it already exists.
Returns the selection either found in or just added to the DOM.

Caveats: does not support arbitrary selectors e.g. ids. Might do multiple appends for selections of more than one
element. Might be slow.
*/

d3.selection.prototype.place = function(selector) {
  var split = selector.split("."),
      tag = split[0],
      klass = split[1],
      klassname = klass ? "."+klass : "",
      sel = this.select(tag+klassname);
  if (sel.empty()){
      sel = this.append(tag)
      if (klass) sel.attr("class", klass)
  }
  return sel;
};
