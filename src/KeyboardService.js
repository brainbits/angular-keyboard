var _ = require('lodash');

/**
 * Keyboard service
 *
 * Watches keyup and keydown events and executes registered binding when they match
 *
 * @param {function(string):Array.<Array.<Array.<number>>>} $$keyboardParser
 * @param {angular.$document} $document
 * @param {Window} $window
 * @param {angular.$log} $log
 * @returns {{enable: function(), disable: function(), reset: function(), on: function()}}
 */
module.exports = function KeyboardService($$keyboardParser, $document, $window, $log, $rootScope) {

    /**
     * Array of currently active (held down) keyCodes
     *
     * @type {Array.<number>}
     */
    var activeKeys = [];

    /**
     * Array of binding objects
     *
     * @type {Array.<Object>}
     */
    var bindings = [];

    /**
     * Array of bindings which are currently active
     *
     * @type {Array.<Object>}
     */
    var currentSequences = [];

    $window = angular.element($window);

    /**
     * Resets active keys and current active bindings
     */
    function reset() {
        activeKeys = [];
        currentSequences = [];
    }

    /**
     * Enables KeyboardJS
     */
    function enable() {
        $document.on('keydown', keydown);
        $document.on('keyup', keyup);
        $window.on('blur mozfullscreenchange webkitfullscreenchange', reset);
    }

    /**
     * Exits all active bindings and disables KeyboardJS
     */
    function disable() {
        reset();
        $document.off('keydown', keydown);
        $document.off('keyup', keyup);
        $window.off('blur mozfullscreenchange webkitfullscreenchange', reset);
    }

    /**
     * Callback which is fired when keydown event is emitted
     *
     * @param {Event} event
     */
    function keydown(event) {

        if (activeKeys.indexOf(event.keyCode) !== -1 || event.originalEvent.repeat) {
            // key is already active. Skip.
            return;
        }

        activeKeys.push(event.keyCode);


        var satisfiableBindings = _.filter(bindings, isSatisfiable);

        // Add newly satisfiable bindings to current sequences
        satisfiableBindings.forEach(function(binding) {
            currentSequences.push(_.cloneDeep(binding));
        });

        // Remove all sequences which are not anymore satisfiable
        currentSequences = _.filter(currentSequences, isSatisfiable);

        // Ensure correct sorting by priority
        currentSequences.sort(sortByPriority);

        executeFirstMatch(event);
    }

    /**
     * Callback which is fired when keyup event is emitted
     *
     * @param {Event} event
     */
    function keyup(event) {

        executeFirstMatch(event);

        // Remove already satisfied combos
        currentSequences.forEach(function(binding) {
            if (isSatisfiedCombo(binding.sequence[0])) {
                binding.sequence.shift();
            }
        });

        activeKeys = _.without(activeKeys, event.keyCode);

        // Remove all sequences which are fully burned
        currentSequences = _.filter(currentSequences, function(binding) {
            return binding.sequence.length > 0;
        });

        // Remove all sequences which are not anymore satisfiable
        currentSequences = _.filter(currentSequences, isSatisfiable);
    }

    /**
     * Returns a priority for a given sequence array. Priority is calculated by number of
     * keys for a combo. For example: `ctrl + a` results in priority 200, but `a` only results
     * in priority 100. This ensures that complexer combos will always be preferred.
     *
     * @param {Array.<Array.<number>>} sequence
     * @returns {number}
     */
    function getPriorityBySequence(sequence) {
        var i, count = 0;
        for (i = 0; i < sequence.length; i += 1) {
            count += sequence[i].length;
        }
        return count * 100;
    }

    /**
     * Returns true if the given binging is satisfiable. This means that all currently held down keys are present in
     * the first combo of its sequence.
     *
     * @param binding
     * @returns {*}
     */
    function isSatisfiable(binding) {
        var combo = binding.sequence[0];

        return _.all(activeKeys, function(keyCode) {
            return combo.indexOf(keyCode) !== -1;
        });
    }

    /**
     * Returns true if the given combo is fully satisfied.
     *
     * @param {Array.<number>} combo
     * @returns {boolean}
     */
    function isSatisfiedCombo(combo) {
        return _.all(combo, function(keyCode) {
            return activeKeys.indexOf(keyCode) !== -1;
        })
    }

    /**
     * Find the first active binding which is satisfiable and matches to type of given event. If this
     * binding is fully satisfied, its callback will be executed.
     *
     * @param {Event} event
     */
    function executeFirstMatch(event) {

        var firstMatch = _.find(currentSequences, function(binding) {
            return binding.sequence.length === 1
                && isSatisfiable(binding)
                && binding.action === event.type
                && !angular.element(event.target).is(binding.ignore);
        });

        if (firstMatch && isSatisfiedCombo(firstMatch.sequence[0])) {
            $rootScope.$apply(function() {
                firstMatch.callback(event);
            });
        }
    }

    /**
     * Comparator for sorting by priority. Higher priority will be preferred
     * @param a
     * @param b
     * @returns {number}
     */
    function sortByPriority(a, b) {
        return b.priority - a.priority;
    }

    /**
     * Registers a new binding
     *
     * @param {string|{}} combo
     * @param {function?} callback
     */
    function registerBinding(combo, callback) {
        var options = {},
            parent = this;

        // Fallback if an object with further options was passed
        if (typeof combo === "object") {
            options = combo;
            combo = options.combo;
            callback = options.callback;
        }

        // Parse combos and add binding for each combo
        $$keyboardParser(combo).forEach(function(comboSequence) {
            var binding = {
                parent: parent,
                sequence: comboSequence,
                callback: callback,
                priority: options.priority || getPriorityBySequence(comboSequence),
                action: options.action || 'keydown',
                ignore: options.ignore || 'input, select, textarea'
            };
            // Last come first serve
            bindings.unshift(binding);
        });

        bindings.sort(sortByPriority);

        return this;
    }

    return {
        enable: enable,
        disable: disable,
        reset: reset,
        on: registerBinding,
        bindTo: function(scope) {
            var newInst = Object.create(this);

            scope.$on('$destroy', function() {
                bindings = _.reject(bindings, function(binding) {
                    return binding.parent === newInst;
                });
            });

            return newInst;
        }
    };
};
