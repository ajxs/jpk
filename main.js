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

var controlValues = {
	distort_interval_min: 50,
	distort_interval_max: 80,
	distort_threshold: 1,
	slicer_seg_length: 75,
	slicer_iterations: 25,
	control7: 15,
	control8: 25,
	bitcrush: true,
	bitcrush_threshold: 5,
	bitcrush_interval: 50
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
	controlValues.distort_interval_min = document.getElementById('control_distort_interval_min').value;
	controlValues.distort_interval_max = document.getElementById('control_distort_interval_max').value;
	controlValues.distort_threshold = document.getElementById('control_distort_threshold').value;
	controlValues.slicer_seg_length = document.getElementById('control_4').value;
	controlValues.slicer_iterations = document.getElementById('control_slicer_iterations').value;
	controlValues.control7 = document.getElementById('control_7').value;
	controlValues.control8 = document.getElementById('control_8').value;
	controlValues.bitcrush = document.getElementById('control_bitcrush').checked;
	controlValues.bitcrush_threshold = document.getElementById('control_bitcrush_threshold').value;
	controlValues.bitcrush_interval = document.getElementById('control_bitcrush_interval').value;
};


function updateControlLabel(node) {
	document.getElementById(node.id + '_value').innerHTML = node.value;
};



var segSource, segTarget, segLength;
var sourceData, targetData;

function crush() {
	getControlValues();
	var dataURL = srcCanvas.toDataURL("image/jpeg", 1.0),
		img_byteArray = base64toBinary(dataURL);

	var img_headerLength = jpeg_getHeaderLength(img_byteArray),
		img_ptr = img_headerLength;

	mainContext.globalCompositeOperation = 'source-over';
	mainContext.globalAlpha = 1;


	var distort = function() {
		while(img_ptr < img_byteArray.length) {
			img_ptr += controlValues.distort_interval_min+(Math.random()*(controlValues.distort_interval_max))|0;
			debug.distort.nSegments++;

			if(Math.random() < (controlValues.distort_threshold/10)) {
				img_byteArray[img_ptr] = (Math.random() * 255)|0;
				debug.distort.nDistortions++;
			}
		}
	};

	var slicer = function() {
		for(var c = 0; c < (controlValues.slicer_iterations)|0; c++) {
			segLength = (Math.random()*50*controlValues.slicer_seg_length)|0;

			segSource = img_byteArray.length;
			while(segSource + segLength > img_byteArray.length) segSource = (Math.random()*img_byteArray.length)|0;		// get random position without going out of bounds
			debug.slicer.segSource = segSource;

			segTarget = img_byteArray.length;
			while(segTarget + segLength > img_byteArray.length) segTarget = (Math.random()*img_byteArray.length)|0;
			debug.slicer.segTarget = segTarget;

			sourceData = img_byteArray.subarray(segSource, segSource+segLength);
			targetData = img_byteArray.subarray(segTarget, segTarget+segLength);

			for(var i = 0; i < segLength; i++) {
				img_byteArray[segSource + i] = targetData[segTarget + i];
				img_byteArray[segTarget + i] = sourceData[segSource + i];
			}
		}
	};


	var bitcrush = function() {
		img_ptr = img_headerLength;
		while(img_ptr < img_byteArray.length) {
			img_ptr += (controlValues.bitcrush_interval*(Math.random()*20))|0;
			debug.bitcrush.nSegments++;
			if(Math.random() < (controlValues.bitcrush_threshold/100)) {
				img_byteArray[img_ptr] = '0A';
				debug.bitcrush.nDistortions++;
			}
		}
	};

	var delay = function() {
		var img_byteArray_delay = base64toBinary(dataURL);
		segLength = (Math.random()*100*controlValues.control8)|0;

		segSource = img_byteArray_delay.length;
		while(segSource + segLength > img_byteArray_delay.length) segSource = (Math.random()*img_byteArray_delay.length)|0;
		debug.delay.segSource = segSource;

		segTarget = img_byteArray_delay.length;
		while(segTarget + segLength > img_byteArray_delay.length) segTarget = (Math.random()*img_byteArray_delay.length)|0;
		debug.delay.segTarget = segSource;

		sourceData = img_byteArray_delay.subarray(segSource, segSource+segLength);
		targetData = img_byteArray_delay.subarray(segTarget, segTarget+segLength);

		for(var i = 0; i < segLength; i++) {
			img_byteArray_delay[segSource + i] = targetData[segTarget + i];
			img_byteArray_delay[segTarget + i] = sourceData[segSource + i];
		}

		var imageResult_delay = binaryToBase64Img(img_byteArray_delay);
		imageResult_delay.onload = function() {
			mainContext.globalCompositeOperation = 'source-over';
			mainContext.globalAlpha = (controlValues.control7/200);
			mainContext.drawImage(imageResult_delay, 0, 0);
		};
	};


	distort();
	if(controlValues.slicer_iterations > 0) slicer();
	if(controlValues.bitcrush) bitcrush();

	var imageResult = binaryToBase64Img(img_byteArray);
	imageResult.onload = function() {
		mainContext.drawImage(imageResult, 0, 0);
		delay();
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
