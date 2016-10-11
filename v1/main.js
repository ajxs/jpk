var img_width, img_height;

var srcCanvas, mainCanvas;
var srcContext, mainContext;

var _fileReader = new FileReader();
var urlCreator = window.URL || window.webkitURL;


function main_init() {
	srcCanvas = document.getElementById('srcCanvas');
	mainCanvas = document.getElementById('mainCanvas');
	
	srcContext = srcCanvas.getContext('2d');
	mainContext = mainCanvas.getContext('2d');
	
	getControlValues();
	loadFileFromImg(document.getElementById('img_5'));	
};

function handleFileInput() {
	document.getElementById('fileInput').click();
};

function recrush() {
	crush();
	
};

function loadFile(files) {
	if(!files[0].type.match('image.*'))  return false;
	
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

	img.src = urlCreator.createObjectURL(files[0]);	
	
	
	
	_fileReader.onload = function(e) {	
		
	};
	
	_fileReader.readAsArrayBuffer(files[0]);

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
	control1 = document.getElementById('control_1').value;
	document.getElementById('control_1_value').innerHTML = document.getElementById('control_1').value;
	
	control2 = document.getElementById('control_2').value;
	document.getElementById('control_2_value').innerHTML = document.getElementById('control_2').value;
	
	control3 = document.getElementById('control_3').value;
	document.getElementById('control_3_value').innerHTML = document.getElementById('control_3').value;
	
	control4 = document.getElementById('control_4').value;
	document.getElementById('control_4_value').innerHTML = document.getElementById('control_4').value;
	
	control5 = document.getElementById('control_5').value;
	document.getElementById('control_5_value').innerHTML = document.getElementById('control_5').value;
	
	control6 = document.getElementById('control_6').value;
	document.getElementById('control_6_value').innerHTML = document.getElementById('control_6').value;
	
	control7 = document.getElementById('control_7').value;
	document.getElementById('control_7_value').innerHTML = document.getElementById('control_7').value;
	
	control8 = document.getElementById('control_8').value;
	document.getElementById('control_8_value').innerHTML = document.getElementById('control_8').value;
	
};

var control1 = 50;
var control2 = 50;
var control3 = 10;

var control4 = 50;
var control5 = 50;
var control6 = 25;

var control7 = 15;
var control8 = 25;

var segLength;
var segSource, segTarget;
var sourceData, targetData;
var increment;

function crush() {
	var dataURL = srcCanvas.toDataURL("image/jpeg", 1.0);
	var img_byteArray = base64toBinary(dataURL);
	var img_byteArray2 = base64toBinary(dataURL);
	
	var img_headerLength = jpeg_getHeaderLength(img_byteArray);
	var img_ptr = 0;
	
	mainContext.globalCompositeOperation = 'source-over';
	mainContext.globalAlpha = 1;
	
	if(control3 > 0) {		// DISTORTION
		img_ptr = img_headerLength;
		while(img_ptr < img_byteArray.length) {
			img_ptr += (control1+(Math.random()*(control2*3))|0);
			if(Math.random()*25 < (control3/20)|0) img_byteArray[img_ptr] = ((Math.random() * 255)|0);
		}		
	} else {	// if no distortion
		mainContext.drawImage(img,0,0);
	}

	if(control6 > 0) {		// SLICER
		for(var c = 0; c < (control6/25)|0; c++) {
			segLength = (Math.random()*50*control4)|0;
			
			segSource = img_byteArray.length;
			while(segSource + segLength > img_byteArray.length) segSource = (Math.random()*img_byteArray.length)|0;
			
			segTarget = img_byteArray.length;
			while(segTarget + segLength > img_byteArray.length) segTarget = (Math.random()*img_byteArray.length)|0;
			
			sourceData = new Uint8Array(segLength);
			targetData = new Uint8Array(segLength);

			for(var i = 0; i < segLength; i++) {
				sourceData[i] = img_byteArray[i + segSource];
				targetData[i] = img_byteArray[i + segTarget];
			}	
			
			for(var i = 0; i < segLength; i++) {
				img_byteArray[segSource + i] = targetData[segTarget + i];
				img_byteArray[segTarget + i] = sourceData[segSource + i];
			}
		}
		
		increment = control2*(Math.random()*5);
		
		for(var c = 0; c < (control6/25)|0; c++) {
			img_ptr = img_headerLength;
			while(img_ptr < img_byteArray.length) {
				img_ptr += increment;
				img_byteArray[img_ptr] = '00';
			}
		}
	}	

	var newImage = binaryToBase64Img(img_byteArray);
	newImage.onload = function() {		// fixes issues with Firefox
		mainContext.drawImage(newImage, 0, 0);

		segLength = (Math.random()*100*control8)|0;		// DELAY
		
		segSource = img_byteArray2.length;
		while(segSource + segLength > img_byteArray2.length) segSource = (Math.random()*img_byteArray2.length)|0;
		

		segTarget = img_byteArray2.length;
		while(segTarget + segLength > img_byteArray2.length) segTarget = (Math.random()*img_byteArray2.length)|0;
		
		
		sourceData = new Uint8Array(segLength);
		targetData = new Uint8Array(segLength);

		for(var i = 0; i < segLength; i++) {
			sourceData[i] = img_byteArray2[i + segSource];
			targetData[i] = img_byteArray2[i + segTarget];
			
			img_byteArray2[segSource + i] = targetData[segTarget + i];
			img_byteArray2[segTarget + i] = sourceData[segSource + i];
			
		}

		var newImage2 = binaryToBase64Img(img_byteArray2);
		newImage2.onload = function() {
			mainContext.globalCompositeOperation = 'source-over';
			mainContext.globalAlpha = (control7/200);
			mainContext.drawImage(newImage2, 0, 0);
		};


	};

};

function jpeg_getHeaderLength(_byteArray) {
	for(var ptr = 2; ptr < _byteArray.length; ptr++) {
		if(_byteArray[ptr].toString(16) == 'ff' && _byteArray[ptr+1].toString(16) == 'da') {
			return ptr+2;
		}
	}
};

function binaryToBase64Img(srcArray) {
	var ascii = Array.prototype.map.call(srcArray, function(x) {	//encode binary to ascii
		return String.fromCharCode(x);
	});
	
	var img = new Image();
	img.src = "data:image/jpeg;base64," + window.btoa(ascii.join(''));
	return img;
};


var BASE64_MARKER = ';base64,';
function base64toBinary(dataURI) {
	var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;

	var raw = window.atob(dataURI.substring(base64Index));	// strips off the base64 encoding marker and converts the rest to binary
	var array = new Uint8Array(new ArrayBuffer(raw.length));
	for(i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);

	return array;
};


function base64toBinaryFF(dataURI) { 
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length; 
    var raw = window.atob(dataURI.substring(base64Index));    // strips off the base64 encoding marker and converts the rest to binary 

    return Uint8Array.from(Array.prototype.map.call(raw,function(x) { 
			return x.charCodeAt(0); 
		}));
};

