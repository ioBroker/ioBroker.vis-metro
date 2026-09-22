/*
 * `vis.binds.basic.state`, `navigation`, `_onChange`, `checkbox` and `toggle` of vis-1, copied unchanged from
 * www/widgets/basic.html of ioBroker.vis (commit e87d80d). The metro templates call them; preview/diff.mjs clicks
 * the vis-1 templates and the React widgets and compares what the two write.
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013-2024 Denis Haev <dogafox@gmail.com>,
 * Copyright (c) 2013      hobbyquaker
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions
 * of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
'use strict';

$.extend(vis.binds.basic, {
        state: function (el, oid) {
            var $this = $(el);
            oid = oid ? oid : $this.attr('data-oid');
            var val = $this.attr('data-val');

            if (oid) {
                $this.attr('data-ctrl-oid', oid);
            }

            if (val === 'true')  val = true;
            if (val === 'false') val = false;

            if (!vis.editMode) {
                var moved = false;
                $this.on('click touchend', function (e) {
                    // Protect against two events
                    if (vis.detectBounce(this)) return;

                    if (moved) return;

                    var oid = $(this).attr('data-ctrl-oid');

                    if ($(this).attr('url-value')) {
                        vis.conn.httpGet($(this).attr('url-value'));
                    }

                    if (oid) {
                        var val = $(this).attr('data-val');
                        if (val === undefined || val === null) val = false;
                        if (val === 'true')  val = true;
                        if (val === 'false') val = false;
                        if (parseFloat(val).toString() == val) val = parseFloat(val);

                        if (oid) vis.setValue(oid, val);
                    }
                }).on('touchmove', function () {
                    moved = true;
                }).on('touchstart', function () {
                    moved = false;
                });
            }
        },
        navigation: function (el, options) {
            if (!vis.editMode && options.nav_view) {
                var $this = $(el);
                var moved = false;
                $this.on('click touchend', function (e) {
                    // Protect against two events
                    if (vis.detectBounce(this)) return;

                    if (moved) return;

                    if (options.background) $('body').css({background: options.background});

                    vis.changeView(options.nav_view, options.nav_view, options.hideOptions, options.showOptions, options.sync);
                    //e.preventDefault();
                    //return false;
                }).on('touchmove', function () {
                    moved = true;
                }).on('touchstart', function () {
                    moved = false;
                });
            }
        },
        _onChange: function (el, oid, wid) {
            var $this = $(el);
            // If still working
            //console.log(oid + ' ' + vis.states.attr(oid + '.val') + ' (' + vis.states.attr(oid + '.ack') + ') - ' + wid + ' ' + vis.states.attr(wid + '.val') + ' (' + vis.states.attr(wid + '.ack') + ')');

            if (wid && (vis.states.attr(wid + '.val') === true)) return;

            var val = vis.states.attr(oid + '.val');

            if (val === 'false') {
                val = false;
            } else if (val === 'true') {
                val = true;
            } else if (typeof val === 'string') {
                var f = parseFloat(val);
                if (f == val) {
                    val = f;
                } else if (val !== '') {
                    val = true;
                } else {
                    val = false;
                }
            }

            if ($this.data('data-numeric')) {
                $this.prop('checked', (val > (($this.data('data-max') - $this.data('data-min')) / 2)));
            } else {
                $this.prop('checked', val);
            }
        },
        checkbox: function (el, numeric, min, max) {
            var $this = $(el);
            var oid   = $this.data('oid'); // Object ID
            var wid   = $this.data('oid-working'); // Work ID

            function onChange() {
                vis.binds.basic._onChange(el, oid, wid);
            }
            if (oid) {
                var bound = [];
                vis.states.bind(oid + '.val', onChange);
                bound.push(oid + '.val');
                if (wid) {
                    vis.states.bind(wid + '.val', onChange);
                    bound.push(wid + '.val');
                }

                // remember all ids, that bound
                $this.closest('.vis-widget')
                    .data('bound', bound)
                    // remember bind handler
                    .data('bindHandler', onChange);
            }

            if (numeric) {
                if (min !== undefined && min !== null && min !== '') {
                    min = parseFloat(min);
                } else {
                    min = 0;
                }

                if (max !== undefined && max !== null && max !== '') {
                    max = parseFloat(max);
                } else {
                    max = 1;
                }
            } else {
                min = false;
                max = true;
            }

            $this.data('min',     min);
            $this.data('max',     max);
            $this.data('numeric', numeric);

            vis.binds.basic._onChange(el, oid, wid);

            if (!vis.editMode) {
                $this.change(function () {
                    var $this_ = $(this);
                    if ($this_.prop('checked')) {
                        vis.setValue($this_.data('oid'), $this_.data('max'));
                    } else {
                        vis.setValue($this_.data('oid'), $this_.data('min'));
                    }
                });
            }
        },
        toggle: function (el, oid) {
            var $this = $(el);
            oid = oid || $this.data('oid');
            var min = $this.data('min');
            var max = $this.data('max');

            var urlTrue     = $this.data('url-true');
            var urlFalse    = $this.data('url-false');
            var oidTrue     = $this.data('oid-true');
            var oidFalse    = $this.data('oid-false');
            var oidTrueVal  = $this.data('oid-true-value');
            var oidFalseVal = $this.data('oid-false-value');
            var readOnly    = $this.data('read-only');

            if (min === '') min = undefined;
            if (max === '') max = undefined;

            if ((oid || oidTrue || urlTrue) && !vis.editMode && !readOnly) {
                var moved = false;
                $this.on('click touchend', function () {
                    // Protect against two events
                    if (vis.detectBounce(this)) return;

                    if (moved) return;

                    var val;

                    if (oidTrue || urlTrue) {
                        if (!oidFalse && oidTrue) oidFalse = oidTrue;
                        if (!urlFalse && urlTrue) urlFalse = urlTrue;

                        if (!oid || oid === 'nothing_selected') {
                            val = !$(this).data('state');
                            // remember state
                            $(this).data('state', val);
                        } else {
                            val = vis.states[oid + '.val'];
                            if (max !== undefined) {
                                if (max === 'true')  max = true;
                                if (max === 'false') max = false;
                                if (val === 'true')  val = true;
                                if (val === 'false') val = false;
                                val = (val == max);
                            } else {
                                val = (val === 1 || val === '1' || val === true || val === 'true');
                            }
                            val = !val; // invert
                        }
                        if (min === undefined || min === 'false' || min === null) min = false;
                        if (max === undefined || max === 'true'  || max === null) max = true;

                        if (oidTrue) {
                            if (val) {
                                if (oidTrueVal === undefined || oidTrueVal === null) oidTrueVal = max;
                                if (oidTrueVal === 'false') oidTrueVal = false;
                                if (oidTrueVal === 'true')  oidTrueVal = true;
                                var f = parseFloat(oidTrueVal);
                                if (f.toString() == oidTrueVal) oidTrueVal = f;
                                vis.setValue(oidTrue,  oidTrueVal);
                            } else {
                                if (oidFalseVal === undefined || oidFalseVal === null) oidFalseVal = min;
                                if (oidFalseVal === 'false') oidFalseVal = false;
                                if (oidFalseVal === 'true')  oidFalseVal = true;
                                var f = parseFloat(oidFalseVal);
                                if (f.toString() == oidFalseVal) oidFalseVal = f;
                                vis.setValue(oidFalse, oidFalseVal);
                            }
                        }

                        if (urlTrue) {
                            if (val) {
                                vis.conn.httpGet(urlTrue)
                            } else {
                                vis.conn.httpGet(urlFalse);
                            }
                        }

                        // show new state
                        if (!oid || oid === 'nothing_selected') {
                            var img = $(this).data('img-class');
                            if (val) {
                                if ($(this).data('as-button')) $(this).addClass('ui-state-active');
                                val = $(this).data('img-true');
                            } else {
                                val = $(this).data('img-false');
                                if ($(this).data('as-button')) $(this).removeClass('ui-state-active');
                            }
                            $(this).find('.' + img).attr('src', val);
                        }
                    } else {
                        var val = vis.states[oid + '.val'];
                        if ((min === undefined && (val === null || val === '' || val === undefined || val === false || val === 'false')) ||
                            (min !== undefined && min == val)) {
                            vis.setValue(oid, max !== undefined ? max : true);
                        } else
                        if ((max === undefined && (val === true || val === 'true')) ||
                            (max !== undefined && val == max))
                        {
                            vis.setValue(oid, min !== undefined ? min : false);
                        } else {
                            val = parseFloat(val);
                            if (min !== undefined && max !== undefined) {
                                if (val >= (max - min) / 2) {
                                    val = min;
                                } else {
                                    val = max;
                                }
                            } else {
                                if (val >= 0.5) {
                                    val = 0;
                                } else {
                                    val = 1;
                                }
                            }
                            vis.setValue(oid, val);
                        }
                    }
                }).on('touchmove', function () {
                    moved = true;
                }).on('touchstart', function () {
                    moved = false;
                }).data('destroy', function (id, $widget) {
                    $widget.off('click touchend').off('touchmove').off('touchstart');
                });
            }
        }
});
