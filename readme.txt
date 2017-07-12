=== Typing Lag Fix for Yoast SEO ===
Contributors: reidbusi
Donate link: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=MPP4SWBSB9XTQ
Tags: Yoast SEO, Lag, JavaScript
Requires at least: 4.0
Tested up to: 4.7.2
Stable tag: 1.0.7
License: GPLv3
License URI: http://www.gnu.org/licenses/gpl.html

Fixes text editing lag caused by keydown events in Yoast SEO's shortcode plugin javascript.

== Description ==
Fixes text editing lag caused by keydown/keyup events in Yoast SEO's shortcode plugin JavaScript. This plugin replaces wp-seo-shortcode-plugin.js with a version that does not include the keydown bindings for Yoast SEO versions 3.0.5 - 3.1.2. For Yoast SEO versions 3.2+ it removes the keyup binding and reduces the loadShortcodes code run frequency from every 0.5 seconds to every 5 seconds for the onchange binding. The appearance of this issue depends on the number of plugins that create shortcodes that are installed on the site, use of page builders, client side cpu power and page length and complexity.

If your site has a lot of plugins that create shortcodes and you have long complicated pages that use a page builder and if you see noticeable typing lag with Yoast SEO installed and active, this plugin should correct it.

**For Yoast SEO version 3.0.5 and later.**

== Installation ==

1. Upload the plugin files to the '/wp-content/plugins/typing-lag-fix-for-yoast-seo' directory, or install the plugin through the WordPress plugins page directly.
2. Activate the plugin through the 'Plugins' page in WordPress.
3. There are no configuration settings.

== Changelog ==

= 1.0.7 =
* Release date: 2017-01-28
* Updated for Yoast SEO versions 3.7.0 - 4.1
* Changed plugin author to new business name (same author).
* Replaced paypal donation link.

= 1.0.6 =
* Release date: 2016-10-03
* Updated for Yoast SEO versions 3.5 - 3.6.1
* Added donate link to readme.txt

= 1.0.5 =
* Release date: 2016-08-04
* Updated for Yoast SEO version 3.4

= 1.0.4 =
* Release date: 2016-04-20
* Updated for Yoast SEO version 3.2

= 1.0.3 =
* Release date: 2016-03-06
* Added Yoast SEO version check

= 1.0.2 =
* Release date: 2016-03-06
* Initial Release
