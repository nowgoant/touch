'use strict';

define(function  (require,exports) {
   var touch = require('touch');
    console.log(touch);

    touch.on('.btn-success','tap',function(){
    console.log(this);
   });
 });