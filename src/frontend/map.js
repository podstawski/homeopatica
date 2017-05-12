const MAPJS = require('mindmup-mapjs'),
	jQuery = require('jquery'),
	themeProvider = require('../theme'),
	ThemeProcessor = require('mindmup-mapjs-layout').ThemeProcessor,
	testMap = require('../example-map2'),
	content = require('mindmup-mapjs-model').content,
    mapSocket = require('./map-socket'),
	scale = require('./scale');


module.exports = function(container_selector,theme_selector,socket,examination) {
		'use strict';
		
		const container = jQuery(container_selector),
			idea = content(testMap),
			mapModel = new MAPJS.MapModel(MAPJS.DOMRender.layoutCalculator, []);

        
		
        if (typeof(examination)=='undefined') examination=0;
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
       
		mapSocket(mapModel,socket,examination);

		jQuery(theme_selector).themeCssWidget(themeProvider, new ThemeProcessor(), mapModel);
		container.domMapWidget(console, mapModel, false);
		jQuery('body').mapToolbarWidget(mapModel);

		if (examination==0) mapModel.setIdea(idea);
		
		

}