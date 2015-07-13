// Freezing ia a simple counting semaphore to prevent changing the stage during
// a transition.
var _freeze = 0
module.exports.freeze = function(){
    _freeze++;
}
module.exports.unfreeze = function(){
    if (_freeze <= 0) console.warn("Unfreezing when freeze is", _freeze)
    _freeze--;
}
module.exports.isFrozen = function(){
    return _freeze > 0;
}

module.exports.approach = function(target, current, step){
    step = step || 0.1;
    if (Math.abs(target-current) <= step) return target;
    if (target < current) return current-step;
    return current + step;
}

module.exports.clamp = function(lo, hi, val){
    return Math.max(lo, Math.min(hi, val));
}

module.exports.cross = function(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
    return c;
}
