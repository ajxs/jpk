'use strict';
var img_width, img_height;

var srcCanvas, mainCanvas;
var srcContext, mainContext;

var urlCreator = window.URL || window.webkitURL;

var debug = {
	jpeg_headerLength: 0,
	distort: {
		nSegments: 0,
		nDistortions: 0
	},
	slicer: {
		segSource: 0,
		segTarget: 0
	},
	bitcrush: {
		nSegments: 0,
		nDistortions: 0
	},
	delay: {
		segSource: 0,
		segTarget: 0
	}
};

var control = {
	jpeg_headerLength: 0,
	distort: {
		intervalMin: 50,
		intervalMax: 80,
		threshold: 1
	},
	slicer: {
		segLength: 75,
		iterations: 25
	},
	bitcrush: {
		enabled: true,
		threshold: 5,
		interval: 50
	},
	delay: {
		alpha: 15,
		segLength: 25
	}
};

function main_init() {
	srcCanvas = document.getElementById('srcCanvas');
	mainCanvas = document.getElementById('mainCanvas');

	srcContext = srcCanvas.getContext('2d');
	mainContext = mainCanvas.getContext('2d');

	loadFileFromImg(document.getElementById('img_5'));
};

function handleFileInput() {
	document.getElementById('fileInput').click();
};


function loadFile(file) {
	if(!file.type.match('image.*'))  return false;

	var img = new Image();
	img.onload = function() {

		img_width = img.naturalWidth;
		img_height = img.naturalHeight;

		srcCanvas.width = img_width;
		srcCanvas.height = img_height;
		mainCanvas.width = img_width;
		mainCanvas.height = img_height;

		srcContext.drawImage(img,0,0);
		crush();
	};

	img.src = urlCreator.createObjectURL(file);

};

function loadFileFromImg(img) {
	img_width = img.naturalWidth;
	img_height = img.naturalHeight;

	srcCanvas.width = img_width;
	srcCanvas.height = img_height;
	mainCanvas.width = img_width;
	mainCanvas.height = img_height;

	srcContext.drawImage(img,0,0);
	crush();
};


function getControlValues() {
	control.distort.intervalMin = document.getElementById('control_distort_interval_min').value;
	control.distort.intervalMax = document.getElementById('control_distort_interval_max').value;
	control.distort.threshold = document.getElementById('control_distort_threshold').value;
	control.slicer.segLength = document.getElementById('control_4').value;
	control.slicer.iterations = document.getElementById('control_slicer_iterations').value;
	control.delay.alpha = document.getElementById('control_7').value;
	control.delay.segLength = document.getElementById('control_8').value;
	control.bitcrush.enabled = document.getElementById('control_bitcrush').checked;
	control.bitcrush.threshold = document.getElementById('control_bitcrush_threshold').value;
	control.bitcrush.interval = document.getElementById('control_bitcrush_interval').value;
};


function updateControlLabel(node) {
	document.getElementById(node.id + '_value').innerHTML = node.value;
};

function crush() {
	getControlValues();
	var img_byteArray = base64toBinary(srcCanvas.toDataURL("image/jpeg", 1.0));
	var img_headerLength = jpeg_getHeaderLength(img_byteArray);

	mainContext.globalCompositeOperation = 'source-over';
	mainContext.globalAlpha = 1;


	var distort = function(_byteArray, _headerLength) {
		var img_ptr = _headerLength || 0;
		while(img_ptr < _byteArray.length) {
			debug.distort.nSegments++;

			if(Math.random() < (control.distort.threshold/10)) {
				_byteArray[img_ptr] = (Math.random() * 255)|0;
				debug.distort.nDistortions++;
			}
			img_ptr += control.distort.intervalMin+(Math.random()*control.distort.intervalMax)|0;
		}
		return _byteArray;
	};

	var slicer = function(_byteArray, _iterations, _segLengthModifier) {
		var segSource, segTarget, segLength;
		var sourceData, targetData;
		for(var c = 0; c < _iterations|0; c++) {
			segLength = (Math.random()*50*_segLengthModifier)|0;

			segSource = _byteArray.length;
			while(segSource + segLength > _byteArray.length) segSource = (Math.random()*_byteArray.length)|0;		// get random position without going out of bounds
			debug.slicer.segSource = segSource;

			segTarget = _byteArray.length;
			while(segTarget + segLength > _byteArray.length) segTarget = (Math.random()*_byteArray.length)|0;
			debug.slicer.segTarget = segTarget;

			sourceData = _byteArray.subarray(segSource, segSource+segLength);
			targetData = _byteArray.subarray(segTarget, segTarget+segLength);

			for(var i = 0; i < segLength; i++) {
				_byteArray[segSource + i] = targetData[segTarget + i];
				_byteArray[segTarget + i] = sourceData[segSource + i];
			}
		}

		return _byteArray;
	};


	var bitcrush = function(_byteArray, _headerLength) {
		var img_ptr = _headerLength || 0;
		while(img_ptr < _byteArray.length) {
			img_ptr += control.bitcrush.interval*(Math.random()*20)|0;
			debug.bitcrush.nSegments++;
			if(Math.random() < (control.bitcrush.threshold/100)) {
				_byteArray[img_ptr] = '0A';
				debug.bitcrush.nDistortions++;
			}
		}
		return _byteArray;
	};

	var delay = function(_byteArray) {
		_byteArray = slicer(_byteArray, 1, control.delay.segLength);

		var imageResult_delay = binaryToBase64Img(_byteArray);
		imageResult_delay.onload = function() {
			mainContext.globalCompositeOperation = 'source-over';
			mainContext.globalAlpha = (control.delay.alpha/200);
			mainContext.drawImage(imageResult_delay, 0, 0);
		};
	};


	img_byteArray = distort(img_byteArray, img_headerLength);
	if(control.slicer.iterations > 0) img_byteArray = slicer(img_byteArray, control.slicer.iterations, control.slicer.segLength);
	if(control.bitcrush.enabled) img_byteArray = bitcrush(img_byteArray, img_headerLength);

	var imageResult = binaryToBase64Img(img_byteArray);
	imageResult.onload = function() {
		mainContext.drawImage(imageResult, 0, 0);
		delay(img_byteArray);
	}

};

function jpeg_getHeaderLength(_byteArray) {
	var ptr = 2;
	while(_byteArray[++ptr] != 255 || _byteArray[ptr+1] != 218) {		// FF DA
		if(ptr >= _byteArray.length) return 0;
	}
	debug.jpeg_headerLength = ptr;
	return ptr;
};


function binaryToBase64Img(srcArray) {
	var img = new Image();
	var data = window.btoa(Array.prototype.map.call(srcArray, function(x) {	//encode binary to ascii
		return String.fromCharCode(x);
	}).join(''));
	img.src = "data:image/jpeg;base64," +  data;
	return img;
};


function stripBase64String(dataURI) {
	return window.atob(dataURI.substring(dataURI.indexOf(';base64,') + 8));
	// strips off the base64 encoding marker and converts the rest to a binary string
};


function base64toBinary(dataURI) {
	return Uint8ClampedArray.from(Array.prototype.map.call(stripBase64String(dataURI), function(x) {
		return x.charCodeAt(0);
	}));

};
