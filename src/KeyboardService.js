var _ = require('lodash');

/**
 * Keyboard service
 *
 * Watches keyup and keydown events and executes registered binding when they match
 *
 * @constructor
 * @param {function(string):Array.<Array.<Array.<number>>>} $$keyboardParser
 * @param {angular.$document} $document
 * @param {Window} $window
 * @param {angular.$log} $log
 * @param {angular.scope} $rootScope
 */
module.exports = ["$$keyboardParser", "$document", "$window", "$log", "$rootScope", function KeyboardService($$keyboardParser, $document, $window, $log, $rootScope) {

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

    /**
     * A counter which is used to prioretize bindings if their priority is identical
     *
     * @type {Number}
     */
    var bindingCounter = 0;

    /**
     * Set the instanceCounter for the initial instance
     *
     * @type {Number}
     */
    this.instanceCounter = 0;

    $window = angular.element($window);

    /**
     * Resets active keys and current active bindings
     */
    function reset() {
        activeKeys = [];
        currentSequences = [];
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
            if (binding.sequence && isSatisfiedCombo(binding.sequence[0])) {
                binding.sequence.shift();
            }
        });

        activeKeys = _.without(activeKeys, event.keyCode);

        // Remove all sequences which are fully burned
        currentSequences = _.filter(currentSequences, function(binding) {
            return binding.sequence === null || binding.sequence.length > 0;
        });

        // Remove all sequences which are not anymore satisfiable
        currentSequences = _.filter(currentSequences, isSatisfiable);

        // Remove all remaining bindings if only catchAlls are left
        if (_.all(currentSequences, {sequence: null})) {
            currentSequences.length = 0;
        }
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
        var combo;
        if (binding.sequence === null) return true;

        combo = binding.sequence[0];

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
        var callbacks = currentSequences
            .filter(function (binding) {
                if (binding.sequence === null) return true;

                return binding.sequence.length === 1
                    && isSatisfiable(binding)
                    && binding.action === event.type
                    && !angular.element(event.target).is(binding.ignore)
                    && isSatisfiedCombo(binding.sequence[0]);
            })
            .map(function (match, idx, matches) {
                return match.callback;
            });

        $rootScope.$apply(function() {
            if (createWrappedCallback(callbacks, 0, event)() === false) {
                stopPropagation(event);
                preventDefault(event);
            }
        });
    }

    /**
     * Return a function which wraps the callback at the given index.
     *
     * This function will be called recursivly for all further callbacks in the array and will provide the wrapper
     * function of the *next* callback as parameter to the *current* callback function.
     *
     * @param {Function[]} callbacks - Array of callback functions
     * @param {Number} idx - Index of the callback function that should be wrapped
     * @param {Object} event - The keyboard event that should be given to the callbacks
     *
     * @returns {Function} wrapper function which will call the original callback
     */
    function createWrappedCallback(callbacks, idx, event) {
        var callback = callbacks[idx];
        return function () {
            if (callback) {
                return callback(event, createWrappedCallback(callbacks, idx+1, event));
            }
        }
    }

    /**
     * Comparator for sorting by priority. Higher priority will be preferred
     * @param a
     * @param b
     * @returns {number}
     */
    function sortByPriority(a, b) {
        var parentPriortityDiff = b.parent.instanceCounter - a.parent.instanceCounter;
        var bindingCounterDiff = b.counter - a.counter;
        var priorityDiff = b.priority - a.priority;

        if (parentPriortityDiff !== 0) {
            return parentPriortityDiff;
        }

        if (priorityDiff !== 0) {
            return priorityDiff;
        }

        return bindingCounterDiff;
    }

    /**
     * prevents default for this event
     *
     * @param {Event} event
     * @returns void
     */
    function preventDefault(event) {
        if (event.preventDefault) {
            event.preventDefault();
            return;
        }

        event.returnValue = false;
    }

    /**
     * Stops propogation for this event
     *
     * @param {Event} event
     * @returns void
     */
    function stopPropagation(event) {
        if (event.stopPropagation) {
            event.stopPropagation();
            return;
        }

        event.cancelBubble = true;
    }

    /**
     * Enables the listeners
     *
     * @return {KeyboardService}
     */
    this.enable = function () {
        $document.on('keydown', keydown);
        $document.on('keyup', keyup);
        $window.on('blur mozfullscreenchange webkitfullscreenchange', reset);
        return this;
    };

    /**
     * Exits all active bindings and disables the listernes
     *
     * @return {KeyboardService}
     */
    this.disable = function () {
        reset();
        $document.off('keydown', keydown);
        $document.off('keyup', keyup);
        $window.off('blur mozfullscreenchange webkitfullscreenchange', reset);
        return this;
    };

    /**
     * Registers a new binding
     *
     * @param {string|{}} combo
     * @param {function?} callback
     * @return {KeyboardService}
     */
    this.on = function registerBinding(combo, callback) {
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
                ignore: options.ignore || 'input, select, textarea',
                counter: bindingCounter++,
                combo: combo
            };
            // Last come first serve
            bindings.unshift(binding);
        });

        bindings.sort(sortByPriority);

        return this;
    };

    /**
     * Returns a new $keyboard instance which is bound to the given scope. All key bindings
     * which are added through this object will be removed when a `$destroy` event is fired on
     * the given scope.
     *
     * @param {angular.Scope} scope
     * @return {KeyboardService}
     */
    this.bindTo = function(scope) {
        var newInst = Object.create(this);
        newInst.instanceCounter = this.instanceCounter + 1;

        scope.$on('$destroy', function() {
            bindings = _.reject(bindings, function(binding) {
                return binding.parent === newInst;
            });
        });

        return newInst;
    };

    /**
     * Add a new callback that binds to all keybindings that were not added on the current instance (see bindTo).
     *
     * @param {function?} callback
     * @return {KeyboardService}
     */
    this.catchAll = function registerCatchAll(callback) {
        var options = {};

        // Fallback if an object with further options was passed
        if (typeof callback === "object") {
            options = callback;
            callback = options.callback;
        }

        // Parse combos and add binding for each combo
        var binding = {
            parent: this,
            sequence: null,
            callback: callback,
            priority: options.priority || -Infinity,
            action: options.action || 'keydown',
            ignore: options.ignore || 'input, select, textarea',
            counter: bindingCounter++
        };
        // Last come first serve
        bindings.unshift(binding);

        bindings.sort(sortByPriority);

        return this;
    };
}];
