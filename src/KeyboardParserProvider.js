var _ = require('lodash');

/**
  * @constructor
 */
module.exports = function KeyboardParserProvider() {

    var keyMappings = {},
        macros = {};

    /**
     * Adds a further key mappings to the parser
     *
     * @param {number} keyCode
     * @param {string|Array.<string>} mappings
     */
    this.addKeyMapping = function(keyCode, mappings) {
        if (!keyMappings[keyCode]) {
            keyMappings[keyCode] = [];
        }
        if (Array.isArray(mappings)) {
            keyMappings[keyCode].push.apply(keyMappings[keyCode], mappings);
        } else {
            keyMappings[keyCode].push(mappings);
        }
    };

    /**
     * Overwrites the complete set of key mappings
     *
     * @param {{}} mappings
     */
    this.setKeyMappings = function(mappings) {
        keyMappings = mappings;
    };

    /**
     * Adds a further macro to the parser. Macros are a map of a specified combo to one or more mapping names. With this
     * we are able to match a string like `percent` to the combo `shift+5` wich result in the two keycodes `16` and `53`.
     *
     * @param {string} combo
     * @param {string|Array.<string>} names
     */
    this.addMacro = function(combo, names) {
        if (!macros[combo]) {
            macros[combo] = [];
        }
        if (Array.isArray(names)) {
            macros[combo].push.apply(macros[combo], names);
        } else {
            macros[combo].push(names);
        }
    };

    /**
     * Overwrites the map of macros
     *
     * @param newMacros
     */
    this.setMacros = function(newMacros) {
        macros = newMacros;
    };

    /**
     * Returns the parser instance
     *
     * @type {function(string):Array.<Array.<Array.<number>>>}
     */
    this.$get = ['$log', function($log) {

        var dictionary = {};

        // walk through key mappings and add them to dictionary
        _.each(keyMappings, function(names, keyCode) {
            _.each(names, function(name) {
                dictionary[name] = [parseInt(keyCode, 10)];
            });
        });

        // walk through macros, parse them to keyCodes and add them to dictionary
        _.each(macros, function(names, combo) {
            var combos = parseKeyCombo(combo);
            _.each(names, function(name) {
                dictionary[name] = _.unique(combos[0][0]);
            });
        });

        function translate(key) {
            if (!dictionary[key]) {
                return $log.error("Unknown key '%s'", key);
            }
            return dictionary[key];
        }

        /**
         * Parses a key combo string into a 3 dimensional array.
         *
         * 1. Alternative combos.
         * 2. Combo sequences. A sequence is a set of key codes that must be satisfied in the order they are defined.
         * 3. Key codes to fulfill the stage.
         *
         * This method was forked from KeyboardJS, Copyright 2011 Robert Hurst. https://github.com/RobertWHurst/KeyboardJS
         *
         * @param  {String|Array}	keyCombo	A key combo string.
         * @return {Array}
         */
        function parseKeyCombo(keyCombo) {
            var s = keyCombo, i = 0, op = 0, ws = false, nc = false, combos = [], combo = [], stage = [], key = '';

            if(typeof keyCombo === 'object' && typeof keyCombo.push === 'function') { return keyCombo; }
            if(typeof keyCombo !== 'string') { throw new Error('Cannot parse "keyCombo" because its type is "' + (typeof keyCombo) + '". It must be a "string".'); }

            //remove leading whitespace
            while(s.charAt(i) === ' ') { i += 1; }
            while(true) {
                if(s.charAt(i) === ' ') {
                    //white space & next combo op
                    while(s.charAt(i) === ' ') { i += 1; }
                    ws = true;
                } else if(s.charAt(i) === ',') {
                    if(op || nc) { throw new Error('Failed to parse key combo. Unexpected , at character index ' + i + '.'); }
                    nc = true;
                    i += 1;
                } else if(s.charAt(i) === '+') {
                    //next key
                    if(key.length) { stage.push.apply(stage, translate(key)); key = ''; }
                    if(op || nc) { throw new Error('Failed to parse key combo. Unexpected + at character index ' + i + '.'); }
                    op = true;
                    i += 1;
                } else if(s.charAt(i) === '>') {
                    //next stage op
                    if(key.length) { stage.push.apply(stage, translate(key)); key = ''; }
                    if(stage.length) { combo.push(stage); stage = []; }
                    if(op || nc) { throw new Error('Failed to parse key combo. Unexpected > at character index ' + i + '.'); }
                    op = true;
                    i += 1;
                } else if(i < s.length - 1 && s.charAt(i) === '!' && (s.charAt(i + 1) === '>' || s.charAt(i + 1) === ',' || s.charAt(i + 1) === '+')) {
                    key += s.charAt(i + 1);
                    op = false;
                    ws = false;
                    nc = false;
                    i += 2;
                } else if(i < s.length && s.charAt(i) !== '+' && s.charAt(i) !== '>' && s.charAt(i) !== ',' && s.charAt(i) !== ' ') {
                    //end combo
                    if(op === false && ws === true || nc === true) {
                        if(key.length) { stage.push.apply(stage, translate(key)); key = ''; }
                        if(stage.length) { combo.push(stage); stage = []; }
                        if(combo.length) { combos.push(combo); combo = []; }
                    }
                    op = false;
                    ws = false;
                    nc = false;
                    //key
                    while(i < s.length && s.charAt(i) !== '+' && s.charAt(i) !== '>' && s.charAt(i) !== ',' && s.charAt(i) !== ' ') {
                        key += s.charAt(i);
                        i += 1;
                    }
                } else {
                    //unknown char
                    i += 1;
                    continue;
                }
                //end of combos string
                if(i >= s.length) {
                    if(key.length) { stage.push.apply(stage, translate(key)); key = ''; }
                    if(stage.length) { combo.push(stage); stage = []; }
                    if(combo.length) { combos.push(combo); combo = []; }
                    break;
                }
            }
            return combos;
        }

        return parseKeyCombo;
    }];



};