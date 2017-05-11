/*global require, document, window, console */
const MAPJS = require('mindmup-mapjs'),
	jQuery = require('jquery'),
	themeProvider = require('./theme'),
	ThemeProcessor = require('mindmup-mapjs-layout').ThemeProcessor,
	testMap = require('./example-map2'),
	content = require('mindmup-mapjs-model').content,
	socket_io = require('socket.io-client'),
	init = function () {
		'use strict';
		const container = jQuery('#container'),
			idea = content(testMap),
			imageInsertController = new MAPJS.ImageInsertController('http://localhost:4999?u='),
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
		
		var socket = socket_io.connect();
		
		jQuery.fn.attachmentEditorWidget = function (mapModel) {
			return this.each(function () {
				mapModel.addEventListener('attachmentOpened', function (nodeId, attachment) {
					mapModel.setAttachment(
							'attachmentEditorWidget',
							nodeId, {
								contentType: 'text/html',
								content: window.prompt('attachment', attachment && attachment.content)
							}
							);
				});
			});
		};
		window.onerror = window.alert;


		jQuery('#themecss').themeCssWidget(themeProvider, new ThemeProcessor(), mapModel);
		container.domMapWidget(console, mapModel, false, imageInsertController);
		jQuery('body').mapToolbarWidget(mapModel);
		jQuery('body').attachmentEditorWidget(mapModel);
		mapModel.setIdea(idea);


		jQuery('#linkEditWidget').linkEditWidget(mapModel);
		window.mapModel = mapModel;
		jQuery('.arrow').click(function () {
			jQuery(this).toggleClass('active');
		});
		imageInsertController.addEventListener('imageInsertError', function (reason) {
			console.log('image insert error', reason);
		});
		container.on('drop', function (e) {
			const dataTransfer = e.originalEvent.dataTransfer;
			e.stopPropagation();
			e.preventDefault();
			if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
				const fileInfo = dataTransfer.files[0];
				if (/\.mup$/.test(fileInfo.name)) {
					const oFReader = new window.FileReader();
					oFReader.onload = function (oFREvent) {
						mapModel.setIdea(content(JSON.parse(oFREvent.target.result)));
					};
					oFReader.readAsText(fileInfo, 'UTF-8');
				}
			}
		});
	};
	
	
document.addEventListener('DOMContentLoaded', init);
