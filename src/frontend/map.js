const MAPJS = require('mindmup-mapjs'),
	jQuery = require('jquery'),
	themeProvider = require('../theme'),
	ThemeProcessor = require('mindmup-mapjs-layout').ThemeProcessor,
	testMap = require('../example-map2'),
	content = require('mindmup-mapjs-model').content,
    mapSocket = require('./map-socket'),
	scale = require('./scale');


module.exports = function(container_selector,theme_selector,menu_selector,socket,examination) {
		'use strict';
		
		const 	container = jQuery(container_selector),
				menu = jQuery(menu_selector),
				idea = content(testMap),
				mapModel = new MAPJS.MapModel(MAPJS.DOMRender.layoutCalculator, []);

        
		
        if (typeof(examination)=='undefined') examination=0;

		
		scale(mapModel);
       
		new mapSocket(mapModel,socket,examination,container,menu);


		jQuery(theme_selector).themeCssWidget(themeProvider, new ThemeProcessor(), mapModel);
		container.domMapWidget(console, mapModel, false);
		jQuery('body').mapToolbarWidget(mapModel);

		if (examination==0) mapModel.setIdea(idea);
		
		
		jQuery(menu_selector+' .translate').translate();

}