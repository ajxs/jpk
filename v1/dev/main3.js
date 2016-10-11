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
	
};

function handleFileInput() {
	document.getElementById('fileInput').click();
};


function loadFile(files) {
	if(!files[0].type.match('image.*'))  return false;

	_fileReader.onload = function(e) {
		var img = new Image();
		img.onload = function() {
			
			var testb = new Uint8Array(e.target.result);
			console.log(testb);
			
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
		
	};
	
	_fileReader.readAsArrayBuffer(files[0]);

};

function loadFileFromImg(img) {
	srcContext.drawImage(img,0,0);
	crush();
};


var control1 = 50;
var control2 = 50;
var control3 = 10;

var control4 = 50;
var control5 = 50;
var control6 = 25;

var control7 = 15;
var control8 = 25;

var test;

function crush() {
	var dataURL = srcCanvas.toDataURL("image/jpeg", 1.0);
	var img_byteArray = convertDataURIToBinary(dataURL);
	
	var img_headerLength = jpeg_getHeaderLength(img_byteArray);
	console.log(img_headerLength);
	
	mainContext.globalCompositeOperation = 'source-over';
	mainContext.globalAlpha = 1;
	
	test = img_byteArray;
	
	var img = getImgBase64(img_byteArray);
	mainContext.drawImage(img,0,0);
	return;
	
	var ptr = 0;
	
	if(control3 > 0) {		// DISTORTION
		ptr = img_headerLength;
		while(ptr < img_byteArray.length) {
			ptr += (control1+(Math.random()*(control2*3))|0);
			if(Math.random()*25 < (control3/20)|0) img_byteArray[ptr] = ((Math.random() * 255)|0);
		}		
	} else {	// if no distortion
		mainContext.drawImage(img,0,0);
	}

	
	var img = getImgBase64(img_byteArray);
	mainContext.drawImage(img,0,0);

};

function jpeg_getHeaderLength(_byteArray) {
	//var b1, b2, ptr = 2;
/*	while(!(b1 == 'ff' && b2 == 'da') && ptr < _byteArray.length) {	// grab header to start of scan
		b1 = _byteArray[ptr++].toString(16);	// get start of segment
		b2 = _byteArray[ptr++].toString(16);
		ptr += (( _byteArray[ptr++] <<8) | _byteArray[ptr++] )-2;	// get size, convert to 16bit
	}
	return (ptr >= _byteArray.length) ? 2 : ptr // if too corrupted and marker cant be found after full scan */
	
	console.log(_byteArray[0].toString(16));
	
	/* var ptr = 2;
	for(ptr = 2; ptr < _byteArray.length; ptr++) {
		if(_byteArray[ptr].toString(16) == 'ff') {
			console.log(ptr);
		}
	}
	
	return ptr; */
};


function getImgBase64(srcArray) {
	var ascii = Array.prototype.map.call(srcArray, function(x) {	//encode binary to ascii
		return String.fromCharCode(x);
	});
	
	var img = new Image();
	img.src = "data:image/jpeg;base64," + window.btoa(ascii.join(''));
	return img;
};

var BASE64_MARKER = ';base64,';
function convertDataURIToBinary(dataURI) {
	var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;

	var raw = window.atob(dataURI.substring(base64Index));	// strips off the base64 encoding marker and converts the rest to binary
	var array = new Uint8Array(new ArrayBuffer(raw.length));
	for(i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);

	return array;
};

function convertDataURIToBinaryFF(dataURI) { 
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length; 
    var raw = window.atob(dataURI.substring(base64Index));    // strips off the base64 encoding marker and converts the rest to binary 

    return Uint8Array.from(Array.prototype.map.call(raw,function(x) { 
			return x.charCodeAt(0); 
		})); 
};

