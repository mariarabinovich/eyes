window.requestAnimFrame = (function(){
	return	window.requestAnimationFrame       || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame    || 
			window.oRequestAnimationFrame      || 
			window.msRequestAnimationFrame     || 
			function(/* function */ callback, /* DOMElement */ element){
				window.setTimeout(callback, 1000 / 60);
			};
}());

function setUpVideo(resources) {
	var seriously = new Seriously();
	var canvas = document.getElementById('canvas');
	var video = document.getElementById('video');
	var target = seriously.target(canvas);
	
	/* effects nodes */

	var chroma = seriously.effect('chroma');
	chroma.weight = 1.32;
	chroma.balance = 0;
	chroma.screen = 'rgb(77, 239, 41)';
	chroma.clipWhite = 0.85;
	chroma.clipBlack = 0.5125;

	chroma.source = video;

	//set up underwater effect
	var water = {
		blend: seriously.effect('blend'),
		ripple: seriously.effect('ripple'),
//		blur: seriously.effect('blur-twopass'),
		blue: seriously.effect('tone')
	};
	
	water.blend.top = chroma;
	water.blend.bottom = resources['images/fish.jpg'].element;

//	water.blur.setInput('radius', 0);

	water.blue.light = 'rgb(140, 140, 255)';
	water.blue.dark = 'rgb(0, 0, 50)';
	water.blue.toned = 0.3;


	water.blue.source = water.blend;
	water.ripple.source = water.blue;
	//todo: blur

	var spirit = {
		blend: seriously.effect('blend'),
		cube: seriously.effect('colorcube')
	};

	spirit.cube.source = video;
	spirit.cube.cube = resources['images/spiritcube.png'].element;


	//set up night vision effect
	//todo: scope and crosshairs
	var night = {
		blend: seriously.effect('blend'),
		nightvision: seriously.effect('nightvision'),
		vignette: seriously.effect('vignette'),
		scanlines: seriously.effect('scanlines')
	};
	
	night.blend.top = chroma;
	night.blend.bottom = resources['images/urbandecay.jpg'].element;

	night.nightvision.source = night.blend;
	night.nightvision.luminanceThreshold = 0.1;
	night.nightvision.amplification = 1.5;

	night.vignette.source = night.nightvision;
	night.vignette.amount = 2.5;	

	night.scanlines.source = night.vignette;
	night.scanlines.intensity = 0.5;
	night.scanlines.lines = 140;
	night.scanlines.size = 0.05;

	var sketch = {
		blend: seriously.effect('blend'),
		white: seriously.effect('color'),
		sketch: seriously.effect('sketch')
	};
	
	sketch.white.color = 'white';
	
	sketch.blend.top = chroma;
	sketch.blend.bottom = sketch.white;

	sketch.sketch.source = sketch.blend;

	var scenes = [
		{
			id: 'water',
			activate: function(output, inputName) {
				output[inputName || 'source'] = water.ripple;//todo: blur
			}
		},
		{
			id: 'nightvision',
			activate: function(output, inputName) {
				output[inputName || 'source'] = night.scanlines;
				//output[inputName || 'source'] = night.nightvision;
			}
		},
		{
			id: 'spirit',
			activate: function(output, inputName) {
				output[inputName || 'source'] = spirit.cube;
			}
		},
/*		{
			id: 'sketch',
			activate: function(output, inputName) {
				output[inputName || 'source'] = sketch.sketch;
			}
		},
*/		{
			id: 'raw',
			activate: function(output, inputName) {
				output[inputName || 'source'] = video;
			}
		}
	];
	
	var transition = seriously.effect('split');
	transition.fuzzy = 0.1;
	target.source = transition;

	function animateInterval(callback, time, finished) {
		var start = Date.now();
		function runner() {
			var diff = Date.now() - start;
			if (diff < time) {
				callback(diff);
				requestAnimFrame(runner);
			} else if (finished) {
				finished();
			}
		}
		runner();
	}

	var activeScene = 0;
	function activateScene(index) {
		function setButtons(tf) {
			var i, max, buttons = document.querySelectorAll('#buttons button');
			for (i = 0, max = buttons.length; i < max; i++) {
				buttons.item(i).disabled = tf;
			}
		}
	
		index = index % scenes.length;
		if (index === activeScene) {
			return;
		}

		var from = scenes[activeScene];
		var to = scenes[index];
		activeScene = index;
		
		target.source = transition;
		from.activate(transition, 'sourceA');
		to.activate(transition, 'sourceB');
		transition.split = 0;

		setButtons(true);
		animateInterval(function (time) {
			transition.split = time/ 500 + 0.1;
		}, 500, function () {
			to.activate(target);
			setButtons(false);
		});
	}

	//set up buttons and transitions
	(function() {
		var i, max, buttons = document.querySelectorAll('#buttons button');
		for (i = 0, max = buttons.length; i < max; i++) {
			buttons.item(i).addEventListener('click', (function(index) {
				return function() {
					activateScene(index);
				};
			}(i)), false);
		}
	}());
	
	scenes[0].activate(target);

	(function draw() {

		//water.blur.radius = Math.abs(Math.sin(Date.now()/1000 + 1 )) * 3 ;
		water.ripple.wave = Math.abs(Math.sin(Date.now()/1000 / 4));
		
		water.ripple.distortion = Math.abs(Math.sin(Date.now()/1000 / 4.5)) * 2;
		var c = Math.sin(Math.PI * video.currentTime / video.duration);
		
		night.nightvision.timer = video.currentTime;
		
		requestAnimFrame(draw);
	}());

	seriously.go();
	
}

function loadResources() {
	
	var loader = new Loaderator();
	
	loader.load([
		{
			url: 'js/video.js',
			id: 'video.js'
		},
		'js/seriously.js'
	], 'base', function() {
		var msg, id, resources = [
			'js/effects/seriously.chroma.js',
			'js/effects/seriously.blend.js',
			'js/effects/seriously.ripple.js',
			'js/effects/seriously.tone.js',
			'js/effects/seriously.colorcube.js',
			'js/effects/seriously.nightvision.js',
			'js/effects/seriously.vignette.js',
			'js/effects/seriously.split.js',
			'js/effects/seriously.scanlines.js',
			'js/effects/seriously.sketch.js',
			'js/effects/seriously.color.js',
//			'js/webgl-debug.js',
			'images/fish.jpg',
			'images/urbandecay.jpg',
			'images/spiritcube.png',
			'images/colorcube.png'
		];
	
		msg = Seriously.incompatible();
		if (msg) {			
			if (msg === 'webgl') {
				id = 'error-webgl';
			} else {
				id = 'error-context';
			}
			document.getElementById(id).style.display = 'block';
			document.getElementById('buttons').style.display = 'none';
			document.getElementById('canvas').style.display = 'none';
			document.getElementById('video').style.display = 'block';
			if (videoJS) {
				videoJS.width(960);
				videoJS.height(540);
			}
			document.getElementById('video').style.height = '540px'
			return;
		}

		loader.load(resources, 'dependent', setUpVideo);
	});
	
	var videoJS;
	loader.addEventListener('base:video.js', function() {
		videoJS = VideoJS.setup('video');
		videoJS.width(960);
		videoJS.height(540);
	});
}
		

var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'js/loaderator.js';
document.getElementsByTagName('head')[0].appendChild(script);

window.LDR8R = window.LDR8R || [];
window.LDR8R.push(loadResources);