(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* global tinyMCE */
/* global wpseoShortcodePluginL10n */
/* global ajaxurl */
/* global _ */
/* global JSON */
/* global console */
var shortcodeNameMatcher = "[^<>&/\\[\\]\x00-\x20=]+?";
var shortcodeAttributesMatcher = "( [^\\]]+?)?";

var shortcodeStartRegex = new RegExp("\\[" + shortcodeNameMatcher + shortcodeAttributesMatcher + "\\]", "g");
var shortcodeEndRegex = new RegExp("\\[/" + shortcodeNameMatcher + "\\]", "g");

(function () {
	"use strict";

	/**
  * The Yoast Shortcode plugin parses the shortcodes in a given piece of text. It analyzes multiple input fields for shortcodes which it will preload using AJAX.
  *
  * @constructor
  * @property {RegExp} keywordRegex Used to match a given string for valid shortcode keywords.
  * @property {RegExp} closingTagRegex Used to match a given string for shortcode closing tags.
  * @property {RegExp} nonCaptureRegex Used to match a given string for non capturing shortcodes.
  * @property {Array} parsedShortcodes Used to store parsed shortcodes.
  */

	var YoastShortcodePlugin = function YoastShortcodePlugin(app) {
		this._app = app;

		this._app.registerPlugin("YoastShortcodePlugin", { status: "loading" });
		this.bindElementEvents();

		var keywordRegexString = "(" + wpseoShortcodePluginL10n.wpseo_shortcode_tags.join("|") + ")";

		// The regex for matching shortcodes based on the available shortcode keywords.
		this.keywordRegex = new RegExp(keywordRegexString, "g");
		this.closingTagRegex = new RegExp("\\[\\/" + keywordRegexString + "\\]", "g");
		this.nonCaptureRegex = new RegExp("\\[" + keywordRegexString + "[^\\]]*?\\]", "g");

		this.parsedShortcodes = [];

		this.loadShortcodes(this.declareReady.bind(this));
	};

	/* YOAST SEO CLIENT */

	/**
  * Declares ready with YoastSEO.
  *
  * @returns {void}
  */
	YoastShortcodePlugin.prototype.declareReady = function () {
		this._app.pluginReady("YoastShortcodePlugin");
		this.registerModifications();
	};

	/**
  * Declares reloaded with YoastSEO.
  *
  * @returns {void}
  */
	YoastShortcodePlugin.prototype.declareReloaded = function () {
		this._app.pluginReloaded("YoastShortcodePlugin");
	};

	/**
  * Registers the modifications for the content in which we want to replace shortcodes.
  *
  * @returns {void}
  */
	YoastShortcodePlugin.prototype.registerModifications = function () {
		this._app.registerModification("content", this.replaceShortcodes.bind(this), "YoastShortcodePlugin");
	};

	/**
  * Removes all unknown shortcodes. Not all plugins properly registerd their shortcodes in the WordPress backend.
  * Since we cannot use the data from these shortcodes they must be removed.
  *
  * @param {string} data The text to remove unknown shortcodes.
  * @returns {string} The text with removed unknown shortcodes.
  */
	YoastShortcodePlugin.prototype.removeUnknownShortCodes = function (data) {
		data = data.replace(shortcodeStartRegex, "");
		data = data.replace(shortcodeEndRegex, "");

		return data;
	};

	/**
  * The callback used to replace the shortcodes.
  *
  * @param {string} data
  * @returns {string}
  */
	YoastShortcodePlugin.prototype.replaceShortcodes = function (data) {
		var parsedShortcodes = this.parsedShortcodes;

		if (typeof data === "string" && parsedShortcodes.length > 0) {
			for (var i = 0; i < parsedShortcodes.length; i++) {
				data = data.replace(parsedShortcodes[i].shortcode, parsedShortcodes[i].output);
			}
		}

		data = this.removeUnknownShortCodes(data);

		return data;
	};

	/* DATA SOURCING */

	/**
  * Get data from inputfields and store them in an analyzerData object. This object will be used to fill
  * the analyzer and the snippetpreview
  *
  * @param {function} callback To declare either ready or reloaded after parsing.
  *
  * @returns {void}
  */
	YoastShortcodePlugin.prototype.loadShortcodes = function (callback) {
		var unparsedShortcodes = this.getUnparsedShortcodes(this.getShortcodes(this.getContentTinyMCE()));
		if (unparsedShortcodes.length > 0) {
			this.parseShortcodes(unparsedShortcodes, callback);
		} else {
			return callback();
		}
	};

	/**
  * Bind elements to be able to reload the dataset if shortcodes get added.
  *
  * @returns {void}
  */
	YoastShortcodePlugin.prototype.bindElementEvents = function () {
		var contentElement = document.getElementById("content") || false;
		var callback = _.debounce(this.loadShortcodes.bind(this, this.declareReloaded.bind(this)), 5000);

		if (contentElement) {
			/* contentElement.addEventListener("keyup", callback); */
			contentElement.addEventListener("change", callback);
		}

		if (typeof tinyMCE !== "undefined" && typeof tinyMCE.on === "function") {
			tinyMCE.on("addEditor", function (e) {
				e.editor.on("change", callback);
				/* e.editor.on("keyup", callback); */
			});
		}
	};

	/**
  * gets content from the content field, if tinyMCE is initialized, use the getContent function to get the data from tinyMCE
  * @returns {String}
  */
	YoastShortcodePlugin.prototype.getContentTinyMCE = function () {
		var val = document.getElementById("content") && document.getElementById("content").value || "";
		if (typeof tinyMCE !== "undefined" && typeof tinyMCE.editors !== "undefined" && tinyMCE.editors.length !== 0) {
			val = tinyMCE.get("content") && tinyMCE.get("content").getContent() || "";
		}

		return val;
	};

	/* SHORTCODE PARSING */

	/**
  * Returns the unparsed shortcodes out of a collection of shortcodes.
  *
  * @param {Array} shortcodes
  * @returns {Array}
  */
	YoastShortcodePlugin.prototype.getUnparsedShortcodes = function (shortcodes) {
		if ((typeof shortcodes === "undefined" ? "undefined" : _typeof(shortcodes)) !== "object") {
			console.error("Failed to get unparsed shortcodes. Expected parameter to be an array, instead received " + (typeof shortcodes === "undefined" ? "undefined" : _typeof(shortcodes)));
			return false;
		}

		var unparsedShortcodes = [];

		for (var i = 0; i < shortcodes.length; i++) {
			var shortcode = shortcodes[i];
			if (unparsedShortcodes.indexOf(shortcode) === -1 && this.isUnparsedShortcode(shortcode)) {
				unparsedShortcodes.push(shortcode);
			}
		}

		return unparsedShortcodes;
	};

	/**
  * Checks if a given shortcode was already parsed.
  *
  * @param {string} shortcode
  * @returns {boolean}
  */
	YoastShortcodePlugin.prototype.isUnparsedShortcode = function (shortcode) {
		var already_exists = false;

		for (var i = 0; i < this.parsedShortcodes.length; i++) {
			if (this.parsedShortcodes[i].shortcode === shortcode) {
				already_exists = true;
			}
		}

		return already_exists === false;
	};

	/**
  * Gets the shortcodes from a given piece of text.
  *
  * @param {string} text
  * @returns {array} The matched shortcodes
  */
	YoastShortcodePlugin.prototype.getShortcodes = function (text) {
		if (typeof text !== "string") {
			/* jshint ignore:start */
			console.error("Failed to get shortcodes. Expected parameter to be a string, instead received" + (typeof text === "undefined" ? "undefined" : _typeof(text)));
			/* jshint ignore:end*/
			return false;
		}

		var captures = this.matchCapturingShortcodes(text);

		// Remove the capturing shortcodes from the text before trying to match the capturing shortcodes.
		for (var i = 0; i < captures.length; i++) {
			text = text.replace(captures[i], "");
		}

		var nonCaptures = this.matchNonCapturingShortcodes(text);

		return captures.concat(nonCaptures);
	};

	/**
  * Matches the capturing shortcodes from a given piece of text.
  *
  * @param {string} text
  * @returns {Array}
  */
	YoastShortcodePlugin.prototype.matchCapturingShortcodes = function (text) {
		var captures = [];

		// First identify which tags are being used in a capturing shortcode by looking for closing tags.
		var captureKeywords = (text.match(this.closingTagRegex) || []).join(" ").match(this.keywordRegex) || [];

		// Fetch the capturing shortcodes and strip them from the text so we can easily match the non capturing shortcodes.
		for (var i = 0; i < captureKeywords.length; i++) {
			var captureKeyword = captureKeywords[i];
			var captureRegex = "\\[" + captureKeyword + "[^\\]]*?\\].*?\\[\\/" + captureKeyword + "\\]";
			var matches = text.match(new RegExp(captureRegex, "g")) || [];

			captures = captures.concat(matches);
		}

		return captures;
	};

	/**
  * Matches the non capturing shortcodes from a given piece of text.
  *
  * @param {string} text
  * @returns {Array}
  */
	YoastShortcodePlugin.prototype.matchNonCapturingShortcodes = function (text) {
		return text.match(this.nonCaptureRegex) || [];
	};

	/**
  * Parses the unparsed shortcodes through AJAX and clears them.
  *
  * @param {Array} shortcodes shortcodes to be parsed.
  * @param {function} callback function to be called in the context of the AJAX callback.
  *
  * @returns {void}
  */
	YoastShortcodePlugin.prototype.parseShortcodes = function (shortcodes, callback) {
		if (typeof callback !== "function") {
			/* jshint ignore:start */
			console.error("Failed to parse shortcodes. Expected parameter to be a function, instead received " + (typeof callback === "undefined" ? "undefined" : _typeof(callback)));
			/* jshint ignore:end */
			return false;
		}

		if ((typeof shortcodes === "undefined" ? "undefined" : _typeof(shortcodes)) === "object" && shortcodes.length > 0) {
			jQuery.post(ajaxurl, {
				action: "wpseo_filter_shortcodes",
				_wpnonce: wpseoShortcodePluginL10n.wpseo_filter_shortcodes_nonce,
				data: shortcodes
			}, function (shortcodeResults) {
				this.saveParsedShortcodes(shortcodeResults, callback);
			}.bind(this));
		} else {
			return callback();
		}
	};

	/**
  * Saves the shortcodes that were parsed with AJAX to `this.parsedShortcodes`
  *
  * @param {Array} shortcodeResults
  * @param {function} callback
  *
  * @returns {void}
  */
	YoastShortcodePlugin.prototype.saveParsedShortcodes = function (shortcodeResults, callback) {
		shortcodeResults = JSON.parse(shortcodeResults);
		for (var i = 0; i < shortcodeResults.length; i++) {
			this.parsedShortcodes.push(shortcodeResults[i]);
		}

		callback();
	};

	window.YoastShortcodePlugin = YoastShortcodePlugin;
})();

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9zcmMvd3Atc2VvLXNob3J0Y29kZS1wbHVnaW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBTSx1QkFBdUIsMkJBQTdCO0FBQ0EsSUFBTSw2QkFBNkIsY0FBbkM7O0FBRUEsSUFBTSxzQkFBc0IsSUFBSSxNQUFKLENBQVksUUFBUSxvQkFBUixHQUErQiwwQkFBL0IsR0FBNEQsS0FBeEUsRUFBK0UsR0FBL0UsQ0FBNUI7QUFDQSxJQUFNLG9CQUFvQixJQUFJLE1BQUosQ0FBWSxTQUFTLG9CQUFULEdBQWdDLEtBQTVDLEVBQW1ELEdBQW5ELENBQTFCOztBQUVFLGFBQVc7QUFDWjs7QUFFQTs7Ozs7Ozs7OztBQVNBLEtBQUksdUJBQXVCLFNBQXZCLG9CQUF1QixDQUFVLEdBQVYsRUFBZ0I7QUFDMUMsT0FBSyxJQUFMLEdBQVksR0FBWjs7QUFFQSxPQUFLLElBQUwsQ0FBVSxjQUFWLENBQTBCLHNCQUExQixFQUFrRCxFQUFFLFFBQVEsU0FBVixFQUFsRDtBQUNBLE9BQUssaUJBQUw7O0FBRUEsTUFBSSxxQkFBcUIsTUFBTSx5QkFBeUIsb0JBQXpCLENBQThDLElBQTlDLENBQW9ELEdBQXBELENBQU4sR0FBa0UsR0FBM0Y7O0FBRUE7QUFDQSxPQUFLLFlBQUwsR0FBb0IsSUFBSSxNQUFKLENBQVksa0JBQVosRUFBZ0MsR0FBaEMsQ0FBcEI7QUFDQSxPQUFLLGVBQUwsR0FBdUIsSUFBSSxNQUFKLENBQVksV0FBVyxrQkFBWCxHQUFnQyxLQUE1QyxFQUFtRCxHQUFuRCxDQUF2QjtBQUNBLE9BQUssZUFBTCxHQUF1QixJQUFJLE1BQUosQ0FBWSxRQUFRLGtCQUFSLEdBQTZCLGFBQXpDLEVBQXdELEdBQXhELENBQXZCOztBQUVBLE9BQUssZ0JBQUwsR0FBd0IsRUFBeEI7O0FBRUEsT0FBSyxjQUFMLENB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QUFNO0FBSGUsSUFBdEIsRUFLQyxVQUFVLGdCQUFWLEVBQTZCO0FBQzVCLFNBQUssb0JBQUwsQ0FBMkIsZ0JBQTNCLEVBQTZDLFFBQTdDO0FBQ0EsSUFGRCxDQUVFLElBRkYsQ0FFUSxJQUZSLENBTEQ7QUFTQSxHQVZELE1BV0s7QUFDSixVQUFPLFVBQVA7QUFDQTtBQUNELEVBdEJEOztBQXdCQTs7Ozs7Ozs7QUFRQSxzQkFBcUIsU0FBckIsQ0FBK0Isb0JBQS9CLEdBQXNELFVBQVUsZ0JBQVYsRUFBNEIsUUFBNUIsRUFBdUM7QUFDNUYscUJBQW1CLEtBQUssS0FBTCxDQUFZLGdCQUFaLENBQW5CO0FBQ0EsT0FBTSxJQUFJLElBQUksQ0FBZCxFQUFpQixJQUFJLGlCQUFpQixNQUF0QyxFQUE4QyxHQUE5QyxFQUFvRDtBQUNuRCxRQUFLLGdCQUFMLENBQXNCLElBQXRCLENBQTRCLGlCQUFrQixDQUFsQixDQUE1QjtBQUNBOztBQUVEO0FBQ0EsRUFQRDs7QUFTQSxRQUFPLG9CQUFQLEdBQThCLG9CQUE5QjtBQUNBLENBL1NDLEdBQUYiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogZ2xvYmFsIHRpbnlNQ0UgKi9cbi8qIGdsb2JhbCB3cHNlb1Nob3J0Y29kZVBsdWdpbkwxMG4gKi9cbi8qIGdsb2JhbCBhamF4dXJsICovXG4vKiBnbG9iYWwgXyAqL1xuLyogZ2xvYmFsIEpTT04gKi9cbi8qIGdsb2JhbCBjb25zb2xlICovXG5jb25zdCBzaG9ydGNvZGVOYW1lTWF0Y2hlciA9IFwiW148PiYvXFxcXFtcXFxcXVxceDAwLVxceDIwPV0rP1wiO1xuY29uc3Qgc2hvcnRjb2RlQXR0cmlidXRlc01hdGNoZXIgPSBcIiggW15cXFxcXV0rPyk/XCI7XG5cbmNvbnN0IHNob3J0Y29kZVN0YXJ0UmVnZXggPSBuZXcgUmVnRXhwKCBcIlxcXFxbXCIgKyBzaG9ydGNvZGVOYW1lTWF0Y2hlciArIHNob3J0Y29kZUF0dHJpYnV0ZXNNYXRjaGVyICsgXCJcXFxcXVwiLCBcImdcIiApO1xuY29uc3Qgc2hvcnRjb2RlRW5kUmVnZXggPSBuZXcgUmVnRXhwKCBcIlxcXFxbL1wiICsgc2hvcnRjb2RlTmFtZU1hdGNoZXIgKyBcIlxcXFxdXCIsIFwiZ1wiICk7XG5cbiggZnVuY3Rpb24oKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8qKlxuXHQgKiBUaGUgWW9hc3QgU2hvcnRjb2RlIHBsdWdpbiBwYXJzZXMgdGhlIHNob3J0Y29kZXMgaW4gYSBnaXZlbiBwaWVjZSBvZiB0ZXh0LiBJdCBhbmFseXplcyBtdWx0aXBsZSBpbnB1dCBmaWVsZHMgZm9yIHNob3J0Y29kZXMgd2hpY2ggaXQgd2lsbCBwcmVsb2FkIHVzaW5nIEFKQVguXG5cdCAqXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0ga2V5d29yZFJlZ2V4IFVzZWQgdG8gbWF0Y2ggYSBnaXZlbiBzdHJpbmcgZm9yIHZhbGlkIHNob3J0Y29kZSBrZXl3b3Jkcy5cblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IGNsb3NpbmdUYWdSZWdleCBVc2VkIHRvIG1hdGNoIGEgZ2l2ZW4gc3RyaW5nIGZvciBzaG9ydGNvZGUgY2xvc2luZyB0YWdzLlxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gbm9uQ2FwdHVyZVJlZ2V4IFVzZWQgdG8gbWF0Y2ggYSBnaXZlbiBzdHJpbmcgZm9yIG5vbiBjYXB0dXJpbmcgc2hvcnRjb2Rlcy5cblx0ICogQHByb3BlcnR5IHtBcnJheX0gcGFyc2VkU2hvcnRjb2RlcyBVc2VkIHRvIHN0b3JlIHBhcnNlZCBzaG9ydGNvZGVzLlxuXHQgKi9cblx0dmFyIFlvYXN0U2hvcnRjb2RlUGx1Z2luID0gZnVuY3Rpb24oIGFwcCApIHtcblx0XHR0aGlzLl9hcHAgPSBhcHA7XG5cblx0XHR0aGlzLl9hcHAucmVnaXN0ZXJQbHVnaW4oIFwiWW9hc3RTaG9ydGNvZGVQbHVnaW5cIiwgeyBzdGF0dXM6IFwibG9hZGluZ1wiIH0gKTtcblx0XHR0aGlzLmJpbmRFbGVtZW50RXZlbnRzKCk7XG5cblx0XHR2YXIga2V5d29yZFJlZ2V4U3RyaW5nID0gXCIoXCIgKyB3cHNlb1Nob3J0Y29kZVBsdWdpbkwxMG4ud3BzZW9fc2hvcnRjb2RlX3RhZ3Muam9pbiggXCJ8XCIgKSArIFwiKVwiO1xuXG5cdFx0Ly8gVGhlIHJlZ2V4IGZvciBtYXRjaGluZyBzaG9ydGNvZGVzIGJhc2VkIG9uIHRoZSBhdmFpbGFibGUgc2hvcnRjb2RlIGtleXdvcmRzLlxuXHRcdHRoaXMua2V5d29yZFJlZ2V4ID0gbmV3IFJlZ0V4cCgga2V5d29yZFJlZ2V4U3RyaW5nLCBcImdcIiApO1xuXHRcdHRoaXMuY2xvc2luZ1RhZ1JlZ2V4ID0gbmV3IFJlZ0V4cCggXCJcXFxcW1xcXFwvXCIgKyBrZXl3b3JkUmVnZXhTdHJpbmcgKyBcIlxcXFxdXCIsIFwiZ1wiICk7XG5cdFx0dGhpcy5ub25DYXB0dXJlUmVnZXggPSBuZXcgUmVnRXhwKCBcIlxcXFxbXCIgKyBrZXl3b3JkUmVnZXhTdHJpbmcgKyBcIlteXFxcXF1dKj9cXFxcXVwiLCBcImdcIiApO1xuXG5cdFx0dGhpcy5wYXJzZWRTaG9ydGNvZGVzID0gW107XG5cblx0XHR0aGlzLmxvYWRTaG9ydGNvZGVzKCB0aGlzLmRlY2xhcmVSZWFkeS5iaW5kKCB0aGlzICkgKTtcblx0fTtcblxuXHQvKiBZT0FTVCBTRU8gQ0xJRU5UICovXG5cblx0LyoqXG5cdCAqIERlY2xhcmVzIHJlYWR5IHdpdGggWW9hc3RTRU8uXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0WW9hc3RTaG9ydGNvZGVQbHVnaW4ucHJvdG90eXBlLmRlY2xhcmVSZWFkeSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuX2FwcC5wbHVnaW5SZWFkeSggXCJZb2FzdFNob3J0Y29kZVBsdWdpblwiICk7XG5cdFx0dGhpcy5yZWdpc3Rlck1vZGlmaWNhdGlvbnMoKTtcblx0fTtcblxuXHQvKipcblx0ICogRGVjbGFyZXMgcmVsb2FkZWQgd2l0aCBZb2FzdFNFTy5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRZb2FzdFNob3J0Y29kZVBsdWdpbi5wcm90b3R5cGUuZGVjbGFyZVJlbG9hZGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fYXBwLnBsdWdpblJlbG9hZGVkKCBcIllvYXN0U2hvcnRjb2RlUGx1Z2luXCIgKTtcblx0fTtcblxuXHQvKipcblx0ICogUmVnaXN0ZXJzIHRoZSBtb2RpZmljYXRpb25zIGZvciB0aGUgY29udGVudCBpbiB3aGljaCB3ZSB3YW50IHRvIHJlcGxhY2Ugc2hvcnRjb2Rlcy5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRZb2FzdFNob3J0Y29kZVBsdWdpbi5wcm90b3R5cGUucmVnaXN0ZXJNb2RpZmljYXRpb25zID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5fYXBwLnJlZ2lzdGVyTW9kaWZpY2F0aW9uKCBcImNvbnRlbnRcIiwgdGhpcy5yZXBsYWNlU2hvcnRjb2Rlcy5iaW5kKCB0aGlzICksIFwiWW9hc3RTaG9ydGNvZGVQbHVnaW5cIiApO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYWxsIHVua25vd24gc2hvcnRjb2Rlcy4gTm90IGFsbCBwbHVnaW5zIHByb3Blcmx5IHJlZ2lzdGVyZCB0aGVpciBzaG9ydGNvZGVzIGluIHRoZSBXb3JkUHJlc3MgYmFja2VuZC5cblx0ICogU2luY2Ugd2UgY2Fubm90IHVzZSB0aGUgZGF0YSBmcm9tIHRoZXNlIHNob3J0Y29kZXMgdGhleSBtdXN0IGJlIHJlbW92ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhIFRoZSB0ZXh0IHRvIHJlbW92ZSB1bmtub3duIHNob3J0Y29kZXMuXG5cdCAqIEByZXR1cm5zIHtzdHJpbmd9IFRoZSB0ZXh0IHdpdGggcmVtb3ZlZCB1bmtub3duIHNob3J0Y29kZXMuXG5cdCAqL1xuXHRZb2FzdFNob3J0Y29kZVBsdWdpbi5wcm90b3R5cGUucmVtb3ZlVW5rbm93blNob3J0Q29kZXMgPSBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRkYXRhID0gZGF0YS5yZXBsYWNlKCBzaG9ydGNvZGVTdGFydFJlZ2V4LCBcIlwiICk7XG5cdFx0ZGF0YSA9IGRhdGEucmVwbGFjZSggc2hvcnRjb2RlRW5kUmVnZXgsIFwiXCIgKTtcblxuXHRcdHJldHVybiBkYXRhO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBUaGUgY2FsbGJhY2sgdXNlZCB0byByZXBsYWNlIHRoZSBzaG9ydGNvZGVzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxuXHQgKiBAcmV0dXJucyB7c3RyaW5nfVxuXHQgKi9cblx0WW9hc3RTaG9ydGNvZGVQbHVnaW4ucHJvdG90eXBlLnJlcGxhY2VTaG9ydGNvZGVzID0gZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0dmFyIHBhcnNlZFNob3J0Y29kZXMgPSB0aGlzLnBhcnNlZFNob3J0Y29kZXM7XG5cblx0XHRpZiAoIHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiICYmIHBhcnNlZFNob3J0Y29kZXMubGVuZ3RoID4gMCApIHtcblx0XHRcdGZvciAoIHZhciBpID0gMDsgaSA8IHBhcnNlZFNob3J0Y29kZXMubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHRcdGRhdGEgPSBkYXRhLnJlcGxhY2UoIHBhcnNlZFNob3J0Y29kZXNbIGkgXS5zaG9ydGNvZGUsIHBhcnNlZFNob3J0Y29kZXNbIGkgXS5vdXRwdXQgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRkYXRhID0gdGhpcy5yZW1vdmVVbmtub3duU2hvcnRDb2RlcyggZGF0YSApO1xuXG5cdFx0cmV0dXJuIGRhdGE7XG5cdH07XG5cblx0LyogREFUQSBTT1VSQ0lORyAqL1xuXG5cdC8qKlxuXHQgKiBHZXQgZGF0YSBmcm9tIGlucHV0ZmllbGRzIGFuZCBzdG9yZSB0aGVtIGluIGFuIGFuYWx5emVyRGF0YSBvYmplY3QuIFRoaXMgb2JqZWN0IHdpbGwgYmUgdXNlZCB0byBmaWxsXG5cdCAqIHRoZSBhbmFseXplciBhbmQgdGhlIHNuaXBwZXRwcmV2aWV3XG5cdCAqXG5cdCAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFRvIGRlY2xhcmUgZWl0aGVyIHJlYWR5IG9yIHJlbG9hZGVkIGFmdGVyIHBhcnNpbmcuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0WW9hc3RTaG9ydGNvZGVQbHVnaW4ucHJvdG90eXBlLmxvYWRTaG9ydGNvZGVzID0gZnVuY3Rpb24oIGNhbGxiYWNrICkge1xuXHRcdHZhciB1bnBhcnNlZFNob3J0Y29kZXMgPSB0aGlzLmdldFVucGFyc2VkU2hvcnRjb2RlcyggdGhpcy5nZXRTaG9ydGNvZGVzKCB0aGlzLmdldENvbnRlbnRUaW55TUNFKCkgKSApO1xuXHRcdGlmICggdW5wYXJzZWRTaG9ydGNvZGVzLmxlbmd0aCA+IDAgKSB7XG5cdFx0XHR0aGlzLnBhcnNlU2hvcnRjb2RlcyggdW5wYXJzZWRTaG9ydGNvZGVzLCBjYWxsYmFjayApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gY2FsbGJhY2soKTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIEJpbmQgZWxlbWVudHMgdG8gYmUgYWJsZSB0byByZWxvYWQgdGhlIGRhdGFzZXQgaWYgc2hvcnRjb2RlcyBnZXQgYWRkZWQuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0WW9hc3RTaG9ydGNvZGVQbHVnaW4ucHJvdG90eXBlLmJpbmRFbGVtZW50RXZlbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbnRlbnRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwiY29udGVudFwiICkgfHwgZmFsc2U7XG5cdFx0dmFyIGNhbGxiYWNrID0gIF8uZGVib3VuY2UoXHR0aGlzLmxvYWRTaG9ydGNvZGVzLmJpbmQoIHRoaXMsIHRoaXMuZGVjbGFyZVJlbG9hZGVkLmJpbmQoIHRoaXMgKSApLCA1MDAgKTtcblxuXHRcdGlmICggY29udGVudEVsZW1lbnQgKSB7XG5cdFx0XHRjb250ZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCBcImtleXVwXCIsIGNhbGxiYWNrICk7XG5cdFx0XHRjb250ZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCBcImNoYW5nZVwiLCBjYWxsYmFjayApO1xuXHRcdH1cblxuXHRcdGlmKCB0eXBlb2YgdGlueU1DRSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgdGlueU1DRS5vbiA9PT0gXCJmdW5jdGlvblwiICkge1xuXHRcdFx0dGlueU1DRS5vbiggXCJhZGRFZGl0b3JcIiwgZnVuY3Rpb24oIGUgKSB7XG5cdFx0XHRcdGUuZWRpdG9yLm9uKCBcImNoYW5nZVwiLCBjYWxsYmFjayApO1xuXHRcdFx0XHRlLmVkaXRvci5vbiggXCJrZXl1cFwiLCBjYWxsYmFjayApO1xuXHRcdFx0fSApO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogZ2V0cyBjb250ZW50IGZyb20gdGhlIGNvbnRlbnQgZmllbGQsIGlmIHRpbnlNQ0UgaXMgaW5pdGlhbGl6ZWQsIHVzZSB0aGUgZ2V0Q29udGVudCBmdW5jdGlvbiB0byBnZXQgdGhlIGRhdGEgZnJvbSB0aW55TUNFXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9XG5cdCAqL1xuXHRZb2FzdFNob3J0Y29kZVBsdWdpbi5wcm90b3R5cGUuZ2V0Q29udGVudFRpbnlNQ0UgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgdmFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwiY29udGVudFwiICkgJiYgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIFwiY29udGVudFwiICkudmFsdWUgfHwgXCJcIjtcblx0XHRpZiAoIHR5cGVvZiB0aW55TUNFICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiB0aW55TUNFLmVkaXRvcnMgIT09IFwidW5kZWZpbmVkXCIgJiYgdGlueU1DRS5lZGl0b3JzLmxlbmd0aCAhPT0gMCApIHtcblx0XHRcdHZhbCA9IHRpbnlNQ0UuZ2V0KCBcImNvbnRlbnRcIiApICYmIHRpbnlNQ0UuZ2V0KCBcImNvbnRlbnRcIiApLmdldENvbnRlbnQoKSB8fCBcIlwiO1xuXHRcdH1cblxuXHRcdHJldHVybiB2YWw7XG5cdH07XG5cblx0LyogU0hPUlRDT0RFIFBBUlNJTkcgKi9cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgdW5wYXJzZWQgc2hvcnRjb2RlcyBvdXQgb2YgYSBjb2xsZWN0aW9uIG9mIHNob3J0Y29kZXMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7QXJyYXl9IHNob3J0Y29kZXNcblx0ICogQHJldHVybnMge0FycmF5fVxuXHQgKi9cblx0WW9hc3RTaG9ydGNvZGVQbHVnaW4ucHJvdG90eXBlLmdldFVucGFyc2VkU2hvcnRjb2RlcyA9IGZ1bmN0aW9uKCBzaG9ydGNvZGVzICkge1xuXHRcdGlmICggdHlwZW9mIHNob3J0Y29kZXMgIT09IFwib2JqZWN0XCIgKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCBcIkZhaWxlZCB0byBnZXQgdW5wYXJzZWQgc2hvcnRjb2Rlcy4gRXhwZWN0ZWQgcGFyYW1ldGVyIHRvIGJlIGFuIGFycmF5LCBpbnN0ZWFkIHJlY2VpdmVkIFwiICsgdHlwZW9mIHNob3J0Y29kZXMgKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHR2YXIgdW5wYXJzZWRTaG9ydGNvZGVzID0gW107XG5cblx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBzaG9ydGNvZGVzLmxlbmd0aDsgaSsrICkge1xuXHRcdFx0dmFyIHNob3J0Y29kZSA9IHNob3J0Y29kZXNbIGkgXTtcblx0XHRcdGlmICggdW5wYXJzZWRTaG9ydGNvZGVzLmluZGV4T2YoIHNob3J0Y29kZSApID09PSAtMSAmJiB0aGlzLmlzVW5wYXJzZWRTaG9ydGNvZGUoIHNob3J0Y29kZSApICkge1xuXHRcdFx0XHR1bnBhcnNlZFNob3J0Y29kZXMucHVzaCggc2hvcnRjb2RlICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVucGFyc2VkU2hvcnRjb2Rlcztcblx0fTtcblxuXHQvKipcblx0ICogQ2hlY2tzIGlmIGEgZ2l2ZW4gc2hvcnRjb2RlIHdhcyBhbHJlYWR5IHBhcnNlZC5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IHNob3J0Y29kZVxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdFlvYXN0U2hvcnRjb2RlUGx1Z2luLnByb3RvdHlwZS5pc1VucGFyc2VkU2hvcnRjb2RlID0gZnVuY3Rpb24oIHNob3J0Y29kZSApIHtcblx0XHR2YXIgYWxyZWFkeV9leGlzdHMgPSBmYWxzZTtcblxuXHRcdGZvciAoIHZhciBpID0gMDsgaSA8IHRoaXMucGFyc2VkU2hvcnRjb2Rlcy5sZW5ndGg7IGkrKyApIHtcblx0XHRcdGlmICggdGhpcy5wYXJzZWRTaG9ydGNvZGVzWyBpIF0uc2hvcnRjb2RlID09PSBzaG9ydGNvZGUgKSB7XG5cdFx0XHRcdGFscmVhZHlfZXhpc3RzID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gYWxyZWFkeV9leGlzdHMgPT09IGZhbHNlO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBHZXRzIHRoZSBzaG9ydGNvZGVzIGZyb20gYSBnaXZlbiBwaWVjZSBvZiB0ZXh0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuXHQgKiBAcmV0dXJucyB7YXJyYXl9IFRoZSBtYXRjaGVkIHNob3J0Y29kZXNcblx0ICovXG5cdFlvYXN0U2hvcnRjb2RlUGx1Z2luLnByb3RvdHlwZS5nZXRTaG9ydGNvZGVzID0gZnVuY3Rpb24oIHRleHQgKSB7XG5cdFx0aWYgKCB0eXBlb2YgdGV4dCAhPT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cblx0XHRcdGNvbnNvbGUuZXJyb3IoIFwiRmFpbGVkIHRvIGdldCBzaG9ydGNvZGVzLiBFeHBlY3RlZCBwYXJhbWV0ZXIgdG8gYmUgYSBzdHJpbmcsIGluc3RlYWQgcmVjZWl2ZWRcIiArIHR5cGVvZiB0ZXh0ICk7XG5cdFx0XHQvKiBqc2hpbnQgaWdub3JlOmVuZCovXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0dmFyIGNhcHR1cmVzID0gdGhpcy5tYXRjaENhcHR1cmluZ1Nob3J0Y29kZXMoIHRleHQgKTtcblxuXHRcdC8vIFJlbW92ZSB0aGUgY2FwdHVyaW5nIHNob3J0Y29kZXMgZnJvbSB0aGUgdGV4dCBiZWZvcmUgdHJ5aW5nIHRvIG1hdGNoIHRoZSBjYXB0dXJpbmcgc2hvcnRjb2Rlcy5cblx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBjYXB0dXJlcy5sZW5ndGg7IGkrKyApIHtcblx0XHRcdHRleHQgPSB0ZXh0LnJlcGxhY2UoIGNhcHR1cmVzWyBpIF0sIFwiXCIgKTtcblx0XHR9XG5cblx0XHR2YXIgbm9uQ2FwdHVyZXMgPSB0aGlzLm1hdGNoTm9uQ2FwdHVyaW5nU2hvcnRjb2RlcyggdGV4dCApO1xuXG5cdFx0cmV0dXJuIGNhcHR1cmVzLmNvbmNhdCggbm9uQ2FwdHVyZXMgKTtcblx0fTtcblxuXHQvKipcblx0ICogTWF0Y2hlcyB0aGUgY2FwdHVyaW5nIHNob3J0Y29kZXMgZnJvbSBhIGdpdmVuIHBpZWNlIG9mIHRleHQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG5cdCAqIEByZXR1cm5zIHtBcnJheX1cblx0ICovXG5cdFlvYXN0U2hvcnRjb2RlUGx1Z2luLnByb3RvdHlwZS5tYXRjaENhcHR1cmluZ1Nob3J0Y29kZXMgPSBmdW5jdGlvbiggdGV4dCApIHtcblx0XHR2YXIgY2FwdHVyZXMgPSBbXTtcblxuXHRcdC8vIEZpcnN0IGlkZW50aWZ5IHdoaWNoIHRhZ3MgYXJlIGJlaW5nIHVzZWQgaW4gYSBjYXB0dXJpbmcgc2hvcnRjb2RlIGJ5IGxvb2tpbmcgZm9yIGNsb3NpbmcgdGFncy5cblx0XHR2YXIgY2FwdHVyZUtleXdvcmRzID0gKCB0ZXh0Lm1hdGNoKCB0aGlzLmNsb3NpbmdUYWdSZWdleCApIHx8IFtdICkuam9pbiggXCIgXCIgKS5tYXRjaCggdGhpcy5rZXl3b3JkUmVnZXggKSB8fCBbXTtcblxuXHRcdC8vIEZldGNoIHRoZSBjYXB0dXJpbmcgc2hvcnRjb2RlcyBhbmQgc3RyaXAgdGhlbSBmcm9tIHRoZSB0ZXh0IHNvIHdlIGNhbiBlYXNpbHkgbWF0Y2ggdGhlIG5vbiBjYXB0dXJpbmcgc2hvcnRjb2Rlcy5cblx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCBjYXB0dXJlS2V5d29yZHMubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHR2YXIgY2FwdHVyZUtleXdvcmQgPSBjYXB0dXJlS2V5d29yZHNbIGkgXTtcblx0XHRcdHZhciBjYXB0dXJlUmVnZXggPSBcIlxcXFxbXCIgKyBjYXB0dXJlS2V5d29yZCArIFwiW15cXFxcXV0qP1xcXFxdLio/XFxcXFtcXFxcL1wiICsgY2FwdHVyZUtleXdvcmQgKyBcIlxcXFxdXCI7XG5cdFx0XHR2YXIgbWF0Y2hlcyA9IHRleHQubWF0Y2goIG5ldyBSZWdFeHAoIGNhcHR1cmVSZWdleCwgXCJnXCIgKSApIHx8IFtdO1xuXG5cdFx0XHRjYXB0dXJlcyA9IGNhcHR1cmVzLmNvbmNhdCggbWF0Y2hlcyApO1xuXHRcdH1cblxuXHRcdHJldHVybiBjYXB0dXJlcztcblx0fTtcblxuXHQvKipcblx0ICogTWF0Y2hlcyB0aGUgbm9uIGNhcHR1cmluZyBzaG9ydGNvZGVzIGZyb20gYSBnaXZlbiBwaWVjZSBvZiB0ZXh0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuXHQgKiBAcmV0dXJucyB7QXJyYXl9XG5cdCAqL1xuXHRZb2FzdFNob3J0Y29kZVBsdWdpbi5wcm90b3R5cGUubWF0Y2hOb25DYXB0dXJpbmdTaG9ydGNvZGVzID0gZnVuY3Rpb24oIHRleHQgKSB7XG5cdFx0cmV0dXJuIHRleHQubWF0Y2goIHRoaXMubm9uQ2FwdHVyZVJlZ2V4ICkgfHwgW107XG5cdH07XG5cblx0LyoqXG5cdCAqIFBhcnNlcyB0aGUgdW5wYXJzZWQgc2hvcnRjb2RlcyB0aHJvdWdoIEFKQVggYW5kIGNsZWFycyB0aGVtLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0FycmF5fSBzaG9ydGNvZGVzIHNob3J0Y29kZXMgdG8gYmUgcGFyc2VkLlxuXHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBjYWxsZWQgaW4gdGhlIGNvbnRleHQgb2YgdGhlIEFKQVggY2FsbGJhY2suXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0WW9hc3RTaG9ydGNvZGVQbHVnaW4ucHJvdG90eXBlLnBhcnNlU2hvcnRjb2RlcyA9IGZ1bmN0aW9uKCBzaG9ydGNvZGVzLCBjYWxsYmFjayApIHtcblx0XHRpZiAoIHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiICkge1xuXHRcdFx0LyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuXHRcdFx0Y29uc29sZS5lcnJvciggXCJGYWlsZWQgdG8gcGFyc2Ugc2hvcnRjb2Rlcy4gRXhwZWN0ZWQgcGFyYW1ldGVyIHRvIGJlIGEgZnVuY3Rpb24sIGluc3RlYWQgcmVjZWl2ZWQgXCIgKyB0eXBlb2YgY2FsbGJhY2sgKTtcblx0XHRcdC8qIGpzaGludCBpZ25vcmU6ZW5kICovXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0aWYgKCB0eXBlb2Ygc2hvcnRjb2RlcyA9PT0gXCJvYmplY3RcIiAmJiBzaG9ydGNvZGVzLmxlbmd0aCA+IDAgKSB7XG5cdFx0XHRqUXVlcnkucG9zdCggYWpheHVybCwge1xuXHRcdFx0XHRhY3Rpb246IFwid3BzZW9fZmlsdGVyX3Nob3J0Y29kZXNcIixcblx0XHRcdFx0X3dwbm9uY2U6IHdwc2VvU2hvcnRjb2RlUGx1Z2luTDEwbi53cHNlb19maWx0ZXJfc2hvcnRjb2Rlc19ub25jZSxcblx0XHRcdFx0ZGF0YTogc2hvcnRjb2Rlcyxcblx0XHRcdH0sXG5cdFx0XHRcdGZ1bmN0aW9uKCBzaG9ydGNvZGVSZXN1bHRzICkge1xuXHRcdFx0XHRcdHRoaXMuc2F2ZVBhcnNlZFNob3J0Y29kZXMoIHNob3J0Y29kZVJlc3VsdHMsIGNhbGxiYWNrICk7XG5cdFx0XHRcdH0uYmluZCggdGhpcyApXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiBjYWxsYmFjaygpO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogU2F2ZXMgdGhlIHNob3J0Y29kZXMgdGhhdCB3ZXJlIHBhcnNlZCB3aXRoIEFKQVggdG8gYHRoaXMucGFyc2VkU2hvcnRjb2Rlc2Bcblx0ICpcblx0ICogQHBhcmFtIHtBcnJheX0gc2hvcnRjb2RlUmVzdWx0c1xuXHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdFlvYXN0U2hvcnRjb2RlUGx1Z2luLnByb3RvdHlwZS5zYXZlUGFyc2VkU2hvcnRjb2RlcyA9IGZ1bmN0aW9uKCBzaG9ydGNvZGVSZXN1bHRzLCBjYWxsYmFjayApIHtcblx0XHRzaG9ydGNvZGVSZXN1bHRzID0gSlNPTi5wYXJzZSggc2hvcnRjb2RlUmVzdWx0cyApO1xuXHRcdGZvciAoIHZhciBpID0gMDsgaSA8IHNob3J0Y29kZVJlc3VsdHMubGVuZ3RoOyBpKysgKSB7XG5cdFx0XHR0aGlzLnBhcnNlZFNob3J0Y29kZXMucHVzaCggc2hvcnRjb2RlUmVzdWx0c1sgaSBdICk7XG5cdFx0fVxuXG5cdFx0Y2FsbGJhY2soKTtcblx0fTtcblxuXHR3aW5kb3cuWW9hc3RTaG9ydGNvZGVQbHVnaW4gPSBZb2FzdFNob3J0Y29kZVBsdWdpbjtcbn0oKSApO1xuIl19