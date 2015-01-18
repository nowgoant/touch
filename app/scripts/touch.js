'use strict';

define(function  (require,exports) {
   var utils = require('utils').utils,
       doc = window.document,
       engine = require('event-engine').eventEngine;

   var _touch,
      touchNames = utils.touchNames,
       config = {
        tap: true,
        tapMaxDistance: 10,
        hold: true,
        tapTime: 100,
        holdTime: 650,
        minScaleRate: 0,
        minRotationAngle: 0
    }, smrEventList = {
        TAP: 'tap',
        DOUBLE_TAP: 'doubletap'
    };

    /** 手势识别 */
    var pos = {
        start: null,
        move: null,
        end: null
    };

    var startTime = 0;
    var startEvent = null;
    var moveEvent = null;
    var endEvent = null;
    var startSwiping = false;
    var startPinch = false;
    var startDrag = false;

    var __offset = {};
    var __touchStart = false;
    var __holdTimer = null;
    var __tapped = false;    
    var __tapTimer = null;
    
    var _rotationSingleFinger = false;   
    var __initialAngle = 0;
    var __rotation = 0;

    var __prev_tapped_end_time = 0;
    var __prev_tapped_pos = null;

    utils.reset = function () {
        startEvent = moveEvent = endEvent = null;
        __tapped = __touchStart = startSwiping = startPinch = false;
        startDrag = false;
        pos = {};
        _rotationSingleFinger = false;   
    };

    var gestures = {
        tap: function (ev) {
            var el = ev.target;
            if (config.tap && el) {
                var now = Date.now();
                var touchTime = now - startTime;
                var distance = utils.getDistance(pos.start[0], pos.move ? pos.move[0] : pos.start[0]);

                clearTimeout(__holdTimer);

                if (config.tapMaxDistance < distance) {return;}

                if (config.holdTime > touchTime && utils.getFingers(ev) <= 1) {
                    __tapped = true;
                    __prev_tapped_end_time = now;
                    __prev_tapped_pos = pos.start[0];
                    __tapTimer = setTimeout(function () {
                        clearTimeout(__tapTimer);
                        engine.trigger(el, smrEventList.TAP, {
                            type: smrEventList.TAP,
                            originEvent: ev,
                            fingersCount: utils.getFingers(ev),
                            position: __prev_tapped_pos
                        });
                    }, config.tapTime);
                }
            }
        }
    };

    var handlerOriginEvent = function (ev) {

        var el = ev.target;
        console.log(el);
        console.log(ev.type);
        switch (ev.type) {
            //case 'touchstart':
            //case 'mousedown':
            case touchNames[0]:
               // __rotation_single_start = [];
                __touchStart = true;
                if (!pos.start || pos.start.length < 2) {
                    pos.start = utils.getPosOfEvent(ev);
                }
                if (utils.getFingers(ev) >= 2) {
                    __initialAngle = parseInt(utils.getAngle180(pos.start[0], pos.start[1]), 10);
                }

                startTime = Date.now();
                startEvent = ev;
                __offset = {};

                var box = el.getBoundingClientRect();
                var docEl = doc.documentElement;
                __offset = {
                    top: box.top + (window.pageYOffset || docEl.scrollTop) - (docEl.clientTop || 0),
                    left: box.left + (window.pageXOffset || docEl.scrollLeft) - (docEl.clientLeft || 0)
                };

                break;
                //case 'touchmove':
                //case 'mousemove':
            case touchNames[1]:
                if (!__touchStart || !pos.start) {return;}
                pos.move = utils.getPosOfEvent(ev);

                break;
            case touchNames[2]:
            case touchNames[3]:
                //case 'touchend':
                //case 'touchcancel':
                //case 'mouseup':
            case 'mouseout':
                if (!__touchStart) {return; }
                endEvent = ev;

                gestures.tap(ev);

                utils.reset();
                __initialAngle = 0;
                __rotation = 0;
                if (ev.touches && ev.touches.length === 1) {
                    __touchStart = true;
                    _rotationSingleFinger = true;
                }
                break;
        }
    };

    var _on = function () {

        var evts, handler, args = arguments;
        if (args.length < 2 || args > 4) {
            return console.error('unexpected arguments!');
        }
        var els = utils.getType(args[0]) === 'string' ? doc.querySelectorAll(args[0]) : args[0];
        els = els.length ? Array.prototype.slice.call(els) : [els];
        //事件绑定
        if (args.length === 3 && utils.getType(args[1]) === 'string') {
            evts = args[1].split(' ');
            handler = args[2];
            evts.forEach(function (evt) {
                if (!utils.hasTouch) {
                    evt = utils.getPCevts(evt);
                }
                els.forEach(function (el) {
                    engine.bind(el, evt, handler);
                });
            });
            return;
        }
    };

    var _off = function () {
        var evts, handler;
        var args = arguments;
        if (args.length < 1 || args.length > 4) {
            return console.error('unexpected arguments!');
        }
        var els = utils.getType(args[0]) === 'string' ? doc.querySelectorAll(args[0]) : args[0];
        els = els.length ? Array.prototype.slice.call(els) : [els];

        if (args.length === 1 || args.length === 2) {
            els.forEach(function (el) {
                evts = args[1] ? args[1].split(' ') : Object.keys(el.listeners);
                if (evts.length) {
                    evts.forEach(function (evt) {
                        if (!utils.hasTouch) {
                            evt = utils.getPCevts(evt);
                        }
                        engine.unbind(el, evt);
                        engine.undelegate(el, evt);
                    });
                }
            });
            return;
        }

        if (args.length === 3 && utils.getType(args[2]) === 'function') {
            handler = args[2];
            els.forEach(function (el) {
                evts = args[1].split(' ');
                evts.forEach(function (evt) {
                    if (!utils.hasTouch) {
                        evt = utils.getPCevts(evt);
                    }
                    engine.unbind(el, evt, handler);
                });
            });
            return;
        }
    };

    var _dispatch = function (el, evt, detail) {
        var args = arguments;
        if (!utils.hasTouch) {
            evt = utils.getPCevts(evt);
        }
        var els = utils.getType(args[0]) === 'string' ? doc.querySelectorAll(args[0]) : args[0];
        els = els.length ? Array.prototype.call(els) : [els];

        els.forEach(function (el) {
            engine.trigger(el, evt, detail);
        });
    };

    touchNames.forEach(function (evt) {
        doc.addEventListener(evt, handlerOriginEvent, false);
    });

    exports.on = exports.bind = exports.live = _on;
    exports.off = exports.unbind = exports.die = _off;
    exports.config = config;
    exports.trigger = _dispatch;

    exports.touch = _touch;
});