<?php
/*
Plugin Name: Typing Lag Fix for Yoast SEO
Description: Fixes text editing lag caused by keydown/keyup events in Yoast SEO's shortcode plugin javascript.
Version: 1.0.7
Author: Wise Builds
Author URI: https://wisebuilds.ca
*/

if ( ! function_exists( 'add_filter' ) ) {
	header( 'Status: 403 Forbidden' );
	header( 'HTTP/1.1 403 Forbidden' );
	exit();
}

if ( in_array( 'wordpress-seo/wp-seo.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) ) {
	
	function ystlf_admin_enqueue_scripts() {
		
		if ( defined( 'WPSEO_VERSION' ) ) {
			
			// versions 3.0.5 to 3.1.2
			if ( version_compare( WPSEO_VERSION, "3.0.5", ">=" ) && version_compare( WPSEO_VERSION, "3.2", "<" ) ) {
				if ( class_exists( 'WPSEO_Metabox' ) ) {
					wp_dequeue_script( 'wp-seo-shortcode-plugin' );
					wp_deregister_script( 'wp-seo-shortcode-plugin' );
					wp_enqueue_script( 'wp-seo-shortcode-plugin', plugin_dir_url( __FILE__ ) . 'js/wp-seo-shortcode-plugin-305.js', array( 'yoast-seo', 'wp-seo-post-scraper' ), '1.0.7', true );
					wp_localize_script( 'wp-seo-shortcode-plugin', 'wpseoShortcodePluginL10n', ystlf_localize_shortcode_plugin_script() );
				}
			}
			
			// versions 3.2 to 3.3.4
			if ( version_compare( WPSEO_VERSION, "3.2", ">=" ) && version_compare( WPSEO_VERSION, "3.4", "<" ) ) {
				if ( class_exists( 'WPSEO_Metabox' ) ) {
					$script_320_handle = WPSEO_Admin_Asset_Manager::PREFIX . 'shortcode-plugin';
					wp_dequeue_script( $script_320_handle );
					wp_deregister_script( $script_320_handle );
					wp_register_script( $script_320_handle, plugin_dir_url( __FILE__ ) . 'js/wp-seo-shortcode-plugin-320.js', array(), '1.0.7', true );
					wp_enqueue_script( $script_320_handle );
					wp_localize_script( $script_320_handle, 'wpseoShortcodePluginL10n', ystlf_localize_shortcode_plugin_script() );
				}
			}
			
			// versions 3.4 to 3.4.2
			if ( version_compare( WPSEO_VERSION, "3.4", ">=" ) && version_compare( WPSEO_VERSION, "3.5", "<" ) ) {
				if ( class_exists( 'WPSEO_Metabox' ) ) {
					$script_340_handle = WPSEO_Admin_Asset_Manager::PREFIX . 'shortcode-plugin';
					wp_dequeue_script( $script_340_handle );
					wp_deregister_script( $script_340_handle );
					wp_register_script( $script_340_handle, plugin_dir_url( __FILE__ ) . 'js/wp-seo-shortcode-plugin-340.js', array(), '1.0.7', true );
					wp_enqueue_script( $script_340_handle );
					wp_localize_script( $script_340_handle, 'wpseoShortcodePluginL10n', ystlf_localize_shortcode_plugin_script() );
				}
			}
			
			// versions 3.5 to 4.0
			if ( version_compare( WPSEO_VERSION, "3.5", ">=" ) && version_compare( WPSEO_VERSION, "4.0.2", "<" ) ) {
				if ( class_exists( 'WPSEO_Metabox' ) ) {
					$script_350_handle = WPSEO_Admin_Asset_Manager::PREFIX . 'shortcode-plugin';
					wp_dequeue_script( $script_350_handle );
					wp_deregister_script( $script_350_handle );
					wp_register_script( $script_350_handle, plugin_dir_url( __FILE__ ) . 'js/wp-seo-shortcode-plugin-350.js', array(), '1.0.7', true );
					wp_enqueue_script( $script_350_handle );
					wp_localize_script( $script_350_handle, 'wpseoShortcodePluginL10n', ystlf_localize_shortcode_plugin_script() );
				}
			}
			
			// versions 4.0.2+
			if ( version_compare( WPSEO_VERSION, "4.0.2", ">=" ) ) {
				if ( class_exists( 'WPSEO_Metabox' ) ) {
					$script_402_handle = WPSEO_Admin_Asset_Manager::PREFIX . 'shortcode-plugin';
					wp_dequeue_script( $script_402_handle );
					wp_deregister_script( $script_402_handle );
					wp_register_script( $script_402_handle, plugin_dir_url( __FILE__ ) . 'js/wp-seo-shortcode-plugin-402.js', array(), '1.0.7', true );
					wp_enqueue_script( $script_402_handle );
					wp_localize_script( $script_402_handle, 'wpseoShortcodePluginL10n', ystlf_localize_shortcode_plugin_script() );
				}
			}
			
		}
	
	}
	add_action( 'admin_enqueue_scripts', 'ystlf_admin_enqueue_scripts', 9999 );
	
	function ystlf_localize_shortcode_plugin_script() {
		
		return array(
			'wpseo_filter_shortcodes_nonce' => wp_create_nonce( 'wpseo-filter-shortcodes' ),
			'wpseo_shortcode_tags'          => ystlf_get_valid_shortcode_tags(),
		);
		
	}
	
	function ystlf_get_valid_shortcode_tags() {
		
		$shortcode_tags = array();

		foreach ( $GLOBALS['shortcode_tags'] as $tag => $description ) {
			array_push( $shortcode_tags, $tag );
		}

		return $shortcode_tags;
		
		
	}

}

?>