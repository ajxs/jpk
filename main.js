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
	}
};

var controlInputElements = {
	distort: {
		intervalMin: null,
		intervalMax: null,
		threshold: null
	},
	slicer: {
		iterations: null
	},
	delay: {

	},
	bitcrush: {
		enabled: null,
		thresold: null,
		interval: null
	}
};


var controlValues = {
	distort_interval_min: 50,
	distort_interval_max: 80,
	distort_threshold: 10,
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

	initControlItems();

	getControlValues();
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



function initControlItems() {
	controlInputElements.distort.intervalMin = document.getElementById('control_distort_interval_min');
	controlInputElements.distort.intervalMax = document.getElementById('control_distort_interval_max');
	controlInputElements.distort.threshold = document.getElementById('control_distort_threshold');

	controlInputElements.slicer.iterations = document.getElementById('control_slicer_iterations');

	controlInputElements.bitcrush.enabled = document.getElementById('control_bitcrush');
	controlInputElements.bitcrush.threshold = document.getElementById('control_bitcrush_threshold');
	controlInputElements.bitcrush.interval = document.getElementById('control_bitcrush_interval');
};

function getControlValues() {
	controlValues.distort_interval_min = controlInputElements.distort.intervalMin.value;
	document.getElementById('control_1_value').innerHTML = controlInputElements.distort.intervalMin.value;

	controlValues.distort_interval_max = controlInputElements.distort.intervalMax.value;
	document.getElementById('control_2_value').innerHTML = controlInputElements.distort.intervalMax.value;

	controlValues.distort_threshold = controlInputElements.distort.threshold.value;
	document.getElementById('control_3_value').innerHTML = controlInputElements.distort.threshold.value;

	controlValues.slicer_seg_length = document.getElementById('control_4').value;
	document.getElementById('control_4_value').innerHTML = document.getElementById('control_4').value;

	controlValues.slicer_iterations = controlInputElements.slicer.iterations.value;
	document.getElementById('control_6_value').innerHTML = controlInputElements.slicer.iterations.value;

	controlValues.control7 = document.getElementById('control_7').value;
	document.getElementById('control_7_value').innerHTML = document.getElementById('control_7').value;

	controlValues.control8 = document.getElementById('control_8').value;
	document.getElementById('control_8_value').innerHTML = document.getElementById('control_8').value;

	controlValues.bitcrush = controlInputElements.bitcrush.enabled.checked;

	controlValues.bitcrush_threshold = controlInputElements.bitcrush.threshold.value;
	document.getElementById('control_bitcrush_threshold_value').innerHTML = controlInputElements.bitcrush.threshold.value;

	controlValues.bitcrush_interval = controlInputElements.bitcrush.interval.value;
	document.getElementById('control_bitcrush_interval_value').innerHTML = controlInputElements.bitcrush.interval.value;

};


var segSource, segTarget, segLength;
var sourceData, targetData;

function crush() {
	var dataURL = srcCanvas.toDataURL("image/jpeg", 1.0),
		img_byteArray = base64toBinary(dataURL);

	var img_headerLength = jpeg_getHeaderLength(img_byteArray),
		img_ptr = img_headerLength;

	mainContext.globalCompositeOperation = 'source-over';
	mainContext.globalAlpha = 1;

	while(img_ptr < img_byteArray.length) {
		img_ptr += controlValues.distort_interval_min+(Math.random()*(controlValues.distort_interval_max))|0;
		debug.distort.nSegments++;

		if(Math.random() < (controlValues.distort_threshold/100)) {
			img_byteArray[img_ptr] = (Math.random() * 255)|0;
			debug.distort.nDistortions++;
		}

	}

	if(controlValues.slicer_iterations > 0) {		// SLICER
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
	}

	if(controlValues.bitcrush) {
		img_ptr = img_headerLength;
		while(img_ptr < img_byteArray.length) {
			img_ptr += (controlValues.bitcrush_interval*(Math.random()*20))|0;
			debug.bitcrush.nSegments++;
			if(Math.random() < (controlValues.bitcrush_threshold/100)) {
				img_byteArray[img_ptr] = '0A';
				debug.bitcrush.nDistortions++;
			}
		}
	}

	var newImage = binaryToBase64Img(img_byteArray);
	var img_byteArray_slicer = base64toBinary(dataURL);
	newImage.onload = function() {		// fixes issues with Firefox
		mainContext.drawImage(newImage, 0, 0);

		segLength = (Math.random()*100*controlValues.control8)|0;		// DELAY

		segSource = img_byteArray_slicer.length;
		while(segSource + segLength > img_byteArray_slicer.length) segSource = (Math.random()*img_byteArray_slicer.length)|0;

		segTarget = img_byteArray_slicer.length;
		while(segTarget + segLength > img_byteArray_slicer.length) segTarget = (Math.random()*img_byteArray_slicer.length)|0;

		sourceData = new Uint8ClampedArray(segLength);
		targetData = new Uint8ClampedArray(segLength);

		for(var i = 0; i < segLength; i++) {
			sourceData[i] = img_byteArray_slicer[i + segSource];
			targetData[i] = img_byteArray_slicer[i + segTarget];

			img_byteArray_slicer[segSource + i] = targetData[segTarget + i];
			img_byteArray_slicer[segTarget + i] = sourceData[segSource + i];
		}

		var newImage2 = binaryToBase64Img(img_byteArray_slicer);
		newImage2.onload = function() {
			mainContext.globalCompositeOperation = 'source-over';
			mainContext.globalAlpha = (controlValues.control7/200);
			mainContext.drawImage(newImage2, 0, 0);
		};

	};

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
	img.src = "data:image/jpeg;base64," + window.btoa(Array.prototype.map.call(srcArray, function(x) {	//encode binary to ascii
		return String.fromCharCode(x);
	}).join(''));
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
