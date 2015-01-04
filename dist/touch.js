  "use strict";

(function (root, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory); //Register as a module.
    } else {
        root.touch = factory();
    }
}(this, function () {
    var utils,
        w3ctouch = ('ontouchstart' in window),
        IE11TOUCH = navigator.pointerEnabled,
        IE9_10TOUCH = navigator.msPointerEnabled,
        doc = window.document,
        touchNames = ["mousedown", "mousemove", "mouseup", ""];

    if (w3ctouch) {
        touchNames = ["touchstart", "touchmove", "touchend", "touchcancel"];
    } else if (IE11TOUCH) {
        touchNames = ["pointerdown", "pointermove", "pointerup", "pointercancel"];
    } else if (IE9_10TOUCH) {
        touchNames = ["MSPointerDown", "MSPointerMove", "MSPointerUp", "MSPointerCancel"];
    }

    utils = {
        PCevts: {
            'touchstart': touchNames[0],
            'touchmove': touchNames[1],
            'touchend': touchNames[2],
            'touchcancel': touchNames[3]
        },
        hasTouch: w3ctouch
    }

    utils.getType = function (obj) {
        return Object.prototype.toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
    };

    utils.getSelector = function (el) {
        if (el.id) {
            return "#" + el.id;
        }
        if (el.className) {
            var cns = el.className.split(/\s+/);
            return "." + cns.join(".");
        } else if (el === document) {
            return "body";
        } else {
            return el.tagName.toLowerCase();
        }
    };

    utils.matchSelector = function (target, selector) {
        return target.webkitMatchesSelector(selector);
    };

    utils.getEventListeners = function (el) {
        return el.listeners;
    };

    utils.getPCevts = function (evt) {
        return this.PCevts[evt] || evt;
    };

    utils.forceReflow = function () {
        var tempDivID = "reflowDivBlock";
        var domTreeOpDiv = doc.getElementById(tempDivID);
        if (!domTreeOpDiv) {
            domTreeOpDiv = doc.createElement("div");
            domTreeOpDiv.id = tempDivID;
            doc.body.appendChild(domTreeOpDiv);
        }
        var parentNode = domTreeOpDiv.parentNode;
        var nextSibling = domTreeOpDiv.nextSibling;
        parentNode.removeChild(domTreeOpDiv);
        parentNode.insertBefore(domTreeOpDiv, nextSibling);
    };

    utils.getPosOfEvent = function (ev) {
        if (this.hasTouch) {
            var posi = [];
            var src = null;

            for (var t = 0, len = ev.touches.length; t < len; t++) {
                src = ev.touches[t];
                posi.push({
                    x: src.pageX,
                    y: src.pageY
                });
            }
            return posi;
        } else {
            return [{
                x: ev.pageX,
                y: ev.pageY
            }];
        }
    };

    utils.getDistance = function (pos1, pos2) {
        var x = pos2.x - pos1.x,
            y = pos2.y - pos1.y;
        return Math.sqrt((x * x) + (y * y));
    };

    utils.getFingers = function (ev) {
        return ev.touches ? ev.touches.length : 1;
    };

    utils.calScale = function (pstart, pmove) {
        if (pstart.length >= 2 && pmove.length >= 2) {
            var disStart = this.getDistance(pstart[1], pstart[0]);
            var disEnd = this.getDistance(pmove[1], pmove[0]);

            return disEnd / disStart;
        }
        return 1;
    };

    utils.getAngle = function (p1, p2) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    };

    utils.getAngle180 = function (p1, p2) {
        var agl = Math.atan((p2.y - p1.y) * -1 / (p2.x - p1.x)) * (180 / Math.PI);
        return (agl < 0 ? (agl + 180) : agl);
    };

    utils.getDirectionFromAngle = function (agl) {
        var directions = {
            up: agl < -45 && agl > -135,
            down: agl >= 45 && agl < 135,
            left: agl >= 135 || agl <= -135,
            right: agl >= -45 && agl <= 45
        };
        for (var key in directions) {
            if (directions[key]) return key;
        }
        return null;
    };

    utils.getXYByElement = function (el) {
        var left = 0,
            top = 0;

        while (el.offsetParent) {
            left += el.offsetLeft;
            top += el.offsetTop;
            el = el.offsetParent;
        }
        return {
            left: left,
            top: top
        };
    };

    utils.reset = function () {
        startEvent = moveEvent = endEvent = null;
        __tapped = __touchStart = startSwiping = startPinch = false;
        startDrag = false;
        pos = {};
        __rotation_single_finger = false;
    };

    utils.isTouchMove = function (ev) {
        return (ev.type === 'touchmove' || ev.type === 'mousemove');
    };

    utils.isTouchEnd = function (ev) {
        return (ev.type === 'touchend' || ev.type === 'mouseup' || ev.type === 'touchcancel');
    };

    utils.env = (function () {
        var os = {}, ua = navigator.userAgent,
            android = ua.match(/(Android)[\s\/]+([\d\.]+)/),
            ios = ua.match(/(iPad|iPhone|iPod)\s+OS\s([\d_\.]+)/),
            wp = ua.match(/(Windows\s+Phone)\s([\d\.]+)/),
            isWebkit = /WebKit\/[\d.]+/i.test(ua),
            isSafari = ios ? (navigator.standalone ? isWebkit : (/Safari/i.test(ua) && !/CriOS/i.test(ua) && !/MQQBrowser/i.test(ua))) : false;
        if (android) {
            os.android = true;
            os.version = android[2];
        }
        if (ios) {
            os.ios = true;
            os.version = ios[2].replace(/_/g, '.');
            os.ios7 = /^7/.test(os.version);
            if (ios[1] === 'iPad') {
                os.ipad = true;
            } else if (ios[1] === 'iPhone') {
                os.iphone = true;
                os.iphone5 = screen.height == 568;
            } else if (ios[1] === 'iPod') {
                os.ipod = true;
            }
        }
        if (wp) {
            os.wp = true;
            os.version = wp[2];
            os.wp8 = /^8/.test(os.version);
        }
        if (isWebkit) {
            os.webkit = true;
        }
        if (isSafari) {
            os.safari = true;
        }
        return os;
    })();

    /** 底层事件绑定/代理支持  */
    var engine = {
        proxyid: 0,
        proxies: [],
        trigger: function (el, evt, detail) {

            detail = detail || {};
            var e, opt = {
                bubbles: true,
                cancelable: true,
                detail: detail
            };

            try {            
                if (typeof CustomEvent !== 'undefined') {
                    e = new CustomEvent(evt, opt);
                    if (el) {
                        el.dispatchEvent(e);
                    }
                } else {
                    e = doc.createEvent("CustomEvent");
                    e.initCustomEvent(evt, true, true, detail);
                    if (el) {
                        el.dispatchEvent(e);
                    }
                }
            } catch (ex) {
                e = doc.createEvent("Events");
                e.initEvent(evt, true, true);
                //event.isTrusted = false 设置这个opera会报错
                if (detail) {
                    e.detail = detail;
                }
                if (el) {
                    el.dispatchEvent(e);
                }                
            }
        },
        bind: function (el, evt, handler) {
            el.listeners = el.listeners || {};
            if (!el.listeners[evt]) {
                el.listeners[evt] = [handler];
            } else {
                el.listeners[evt].push(handler);
            }
            var proxy = function (e) {
                if (utils.env.ios7) {
                    utils.forceReflow();
                }
                e.originEvent = e;
                for (var p in e.detail) {
                    if (p !== 'type') {
                        e[p] = e.detail[p];
                    }
                }
                e.startRotate = function () {
                    __rotation_single_finger = true;
                };
                var returnValue = handler.call(e.target, e);
                if (typeof returnValue !== "undefined" && !returnValue) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            };
            handler.proxy = handler.proxy || {};
            if (!handler.proxy[evt]) {
                handler.proxy[evt] = [this.proxyid++];
            } else {
                handler.proxy[evt].push(this.proxyid++);
            }
            this.proxies.push(proxy);
            if (el.addEventListener) {
                el.addEventListener(evt, proxy, false);
            }
        },
        unbind: function (el, evt, handler) {
            if (!handler) {
                var handlers = el.listeners[evt];
                if (handlers && handlers.length) {
                    handlers.forEach(function (handler) {
                        el.removeEventListener(evt, handler, false);
                    });
                }
            } else {
                var proxyids = handler.proxy[evt];
                if (proxyids && proxyids.length) {
                    proxyids.forEach(function () {
                        if (el.removeEventListener) {
                            el.removeEventListener(evt, this.proxies[this.proxyid], false);
                        }
                    });
                }
            }
        },
        delegate: function (el, evt, sel, handler) {
            var proxy = function (e) {
                var target, returnValue;
                e.originEvent = e;
                for (var p in e.detail) {
                    if (p !== 'type') {
                        e[p] = e.detail[p];
                    }
                }
                e.startRotate = function () {
                    __rotation_single_finger = true;
                };
                var integrateSelector = utils.getSelector(el) + " " + sel;
                var match = utils.matchSelector(e.target, integrateSelector);
                var ischild = utils.matchSelector(e.target, integrateSelector + " " + e.target.nodeName);
                if (!match && ischild) {
                    if (utils.env.ios7) {
                        utils.forceReflow();
                    }
                    target = e.target;
                    while (!utils.matchSelector(target, integrateSelector)) {
                        target = target.parentNode;
                    }
                    returnValue = handler.call(e.target, e);
                    if (typeof returnValue !== "undefined" && !returnValue) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                } else {
                    if (utils.env.ios7) {
                        utils.forceReflow();
                    }
                    if (match || ischild) {
                        returnValue = handler.call(e.target, e);
                        if (typeof returnValue !== "undefined" && !returnValue) {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    }
                }
            };
            handler.proxy = handler.proxy || {};
            if (!handler.proxy[evt]) {
                handler.proxy[evt] = [this.proxyid++];
            } else {
                handler.proxy[evt].push(this.proxyid++);
            }
            this.proxies.push(proxy);
            el.listeners = el.listeners || {};
            if (!el.listeners[evt]) {
                el.listeners[evt] = [proxy];
            } else {
                el.listeners[evt].push(proxy);
            }
            if (el.addEventListener) {
                el.addEventListener(evt, proxy, false);
            }
        },
        undelegate: function (el, evt, sel, handler) {
            if (!handler) {
                var listeners = el.listeners[evt];
                listeners.forEach(function (proxy) {
                    el.removeEventListener(evt, proxy, false);
                });
            } else {
                var proxyids = handler.proxy[evt];
                if (proxyids.length) {
                    proxyids.forEach(function (proxyid) {
                        if (el.removeEventListener) {
                            el.removeEventListener(evt, this.proxies[this.proxyid], false);
                        }
                    });
                }
            }
        }
    };

    var config = {
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
    var fingers = 0;
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
    
    var __rotation_single_finger = false;   
    var __initial_angle = 0;
    var __rotation = 0;

    var __prev_tapped_end_time = 0;
    var __prev_tapped_pos = null;

    var gestures = {
        tap: function (ev) {
            var el = ev.target;
            if (config.tap && el) {
                var now = Date.now();
                var touchTime = now - startTime;
                var distance = utils.getDistance(pos.start[0], pos.move ? pos.move[0] : pos.start[0]);

                clearTimeout(__holdTimer);

                if (config.tapMaxDistance < distance) return;

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
                    __initial_angle = parseInt(utils.getAngle180(pos.start[0], pos.start[1]), 10);
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
                if (!__touchStart || !pos.start) return;
                pos.move = utils.getPosOfEvent(ev);

                break;
            case touchNames[2]:
            case touchNames[3]:
                //case 'touchend':
                //case 'touchcancel':
                //case 'mouseup':
            case 'mouseout':
                if (!__touchStart) return;
                endEvent = ev;

                gestures.tap(ev);

                utils.reset();
                __initial_angle = 0;
                __rotation = 0;
                if (ev.touches && ev.touches.length === 1) {
                    __touchStart = true;
                    __rotation_single_finger = true;
                }
                break;
        }
    };

    var _on = function () {

        var evts, handler, args = arguments;
        if (args.length < 2 || args > 4) {
            return console.error("unexpected arguments!");
        }
        var els = utils.getType(args[0]) === 'string' ? doc.querySelectorAll(args[0]) : args[0];
        els = els.length ? Array.prototype.slice.call(els) : [els];
        //事件绑定
        if (args.length === 3 && utils.getType(args[1]) === 'string') {
            evts = args[1].split(" ");
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
            return console.error("unexpected arguments!");
        }
        var els = utils.getType(args[0]) === 'string' ? doc.querySelectorAll(args[0]) : args[0];
        els = els.length ? Array.prototype.slice.call(els) : [els];

        if (args.length === 1 || args.length === 2) {
            els.forEach(function (el) {
                evts = args[1] ? args[1].split(" ") : Object.keys(el.listeners);
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
                evts = args[1].split(" ");
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

    var exports = {};

    exports.on = exports.bind = exports.live = _on;
    exports.off = exports.unbind = exports.die = _off;
    exports.config = config;
    exports.trigger = _dispatch;

    return exports;
}));

