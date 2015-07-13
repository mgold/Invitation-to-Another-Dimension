/* d3.selection.translate()  -  an unofficial add-on
Translate an SVG selection by passing in two arguments, a two-value array, or
a function that produces a two-value array when called with the usual arguments.
Pass no arguments to retrieve the current translation.

Caveats: Will clobber any other SVG transforms. Does not work with transitions.
*/

d3.selection.prototype.translate = function(a, b) {
  if (typeof a === "function"){
    return this.each(function(){
      var x = a.apply(this, arguments);
      if (x == null) return this.removeAttribute("transform");
      else return this.setAttribute("transform", "translate(" + x + ")");
    })
  }
  return arguments.length === 0
    ? d3.transform(this.attr("transform")).translate
    : arguments.length === 1
      ? this.attr("transform", "translate(" + a + ")")
      : this.attr("transform", "translate(" + [a, b] + ")")
};
