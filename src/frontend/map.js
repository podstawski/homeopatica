const MAPJS = require('mindmup-mapjs'),
	jQuery = require('jquery'),
	themeProvider = require('../theme'),
	ThemeProcessor = require('mindmup-mapjs-layout').ThemeProcessor,
	testMap = require('../example-map2'),
	content = require('mindmup-mapjs-model').content,
	scale = require('./scale');


module.exports = function(container_selector,theme_selector,socket) {
		'use strict';
		const container = jQuery(container_selector),
			idea = content(testMap),
			mapModel = new MAPJS.MapModel(MAPJS.DOMRender.layoutCalculator, []);

					/*

		var a = function (x,a,b,c) {
			console.log(x,a, b, c);
		};
		mapModel.addEventListener('nodeTitleChanged', a);
		mapModel.addEventListener('nodeMoved', a);
		//mapModel.addEventListener('nodeCreated', a);
		mapModel.addEventListener('nodeAttrChanged', a);
		mapModel.addEventListener('nodeSelectionChanged', a);
		*/
		
		scale(mapModel);
		

		jQuery(theme_selector).themeCssWidget(themeProvider, new ThemeProcessor(), mapModel);
		container.domMapWidget(console, mapModel, false);
		jQuery('body').mapToolbarWidget(mapModel);

		mapModel.setIdea(idea);
		

}