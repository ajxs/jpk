var img_width, img_height;

var srcCanvas, mainCanvas;
var srcContext, mainContext;

var _fileReader = new FileReader();
var urlCreator = window.URL || window.webkitURL;

var _byteArray, _byteArray2;

var _srcByteArray, _mainByteArray;

function main_init() {
	srcCanvas = document.getElementById('srcCanvas');
	mainCanvas = document.getElementById('mainCanvas');
	
	srcContext = srcCanvas.getContext('2d');
	mainContext = mainCanvas.getContext('2d');
	
	//handleImgSelect(document.getElementById("img_5"));
	
};

function handleFileInput() {
	document.getElementById('fileInput').click();
};

function handleImgSelect(img) {
	img_width = img.naturalWidth;
	img_height = img.naturalHeight;

	srcCanvas.width = img_width;
	srcCanvas.height = img_height;
	mainCanvas.width = img_width;
	mainCanvas.height = img_height;
	
	srcContext.drawImage(img, 0, 0);

	crushFile(img);
};


function loadFile(files) {
	if(!files[0].type.match('image.*'))  return false;

	_fileReader.onload = function(e) {
		_byteArray = new Uint8Array(e.target.result);
		_byteArray2 = new Uint8Array(e.target.result);
		
		var dataURL = urlCreator.createObjectURL(new Blob( [_byteArray], {
			type: "image/png"
		} ));

		var img = new Image();
		img.onload = function() {
			handleImgSelect(img);
		};
		
		img.src = dataURL;
	}
	
	_fileReader.readAsArrayBuffer(files[0]);
	document.getElementById('fileInfo').innerHTML = files[0].name;
};


function getImgBase64(srcArray) {
	var imgLength = srcArray.length;
	var s = [imgLength];
	for(var i = 0; i < imgLength; i++) {
		s[i] = String.fromCharCode(srcArray[i]);
	}
	
	var img = new Image();
	var data = window.btoa(s.join(''));
	img.src = "data:image/png;base64," + data;
	
	return img;
};


function jpeg_getHeaderLength() {
	var b1, b2, ptr = 2;
	while(!(b1 == 'ff' && b2 == 'da') && ptr < _byteArray.length) {	// grab header to start of scan
		b1 = _byteArray[ptr++].toString(16);	// get start of segment
		b2 = _byteArray[ptr++].toString(16);
		ptr += (( _byteArray[ptr++] <<8) | _byteArray[ptr++] )-2;	// get size, convert to 16bit
	}
	return (ptr >= _byteArray.length) ? 2 : ptr // if too corrupted and marker cant be found after full scan
};



var control1 = 50;
var control2 = 50;
var control3 = 10;

var control4 = 50;
var control5 = 50;
var control6 = 25;

var control7 = 15;
var control8 = 25;


function crushFile(img) {
	
	var _headerLength = jpeg_getHeaderLength();
	
	mainContext.globalCompositeOperation = 'source-over';
	mainContext.globalAlpha = 1;
	
	var ptr = 0;
	
	if(control3 > 0) {		// DISTORTION
		ptr = _headerLength;
		while(ptr < _byteArray.length) {
			ptr += (control1+(Math.random()*(control2*3))|0);
			if(Math.random()*25 < (control3/20)|0) _byteArray[ptr] = ((Math.random() * 255)|0);
		}		
	} else {	// if no distortion
		mainContext.drawImage(img,0,0);
	}
	
	
	if(control6 > 0) {		// SLICER
		for(var c = 0; c < (control6/25)|0; c++) {
			var segLength = (Math.random()*50*control4)|0;
			
			var segSource = _byteArray.length;
			while(segSource + segLength > _byteArray.length) segSource = (Math.random()*_byteArray.length)|0;
			

			var segTarget = _byteArray.length;
			while(segTarget + segLength > _byteArray.length) segTarget = (Math.random()*_byteArray.length)|0;
			
			
			var sourceData = new Uint8Array(segLength);
			var targetData = new Uint8Array(segLength);

			for(var i = 0; i < segLength; i++) {
				sourceData[i] = _byteArray[i + segSource];
				targetData[i] = _byteArray[i + segTarget];
			}	
			
			for(var i = 0; i < segLength; i++) {
				_byteArray[segSource + i] = targetData[segTarget + i];
				_byteArray[segTarget + i] = sourceData[segSource + i];
			}
		}
		
		var increment = control2*(Math.random()*5);
		
		var ptr = _headerLength;
		var inc = 0;
		
		for(var c = 0; c < (control6/25)|0; c++) {
			ptr = _headerLength;
			while(ptr < _byteArray.length) {
				ptr += increment;
				_byteArray[ptr] = '00';
				inc++;
			}
		}
	}
		
	mainContext.globalCompositeOperation = 'source-over';
	mainContext.globalAlpha = 1;
	var result1 = getImgBase64(_byteArray);
	mainContext.width = result1.width;
	mainContext.height = result1.height;
	
	mainContext.drawImage(result1,0,0);
	
	
	var segLength = (Math.random()*100*control8)|0;		// SPECTRAL
	
	var segSource = _byteArray2.length;
	while(segSource + segLength > _byteArray2.length) segSource = (Math.random()*_byteArray2.length)|0;
	

	var segTarget = _byteArray2.length;
	while(segTarget + segLength > _byteArray2.length) segTarget = (Math.random()*_byteArray2.length)|0;
	
	
	var sourceData = new Uint8Array(segLength);
	var targetData = new Uint8Array(segLength);

	for(var i = 0; i < segLength; i++) {
		sourceData[i] = _byteArray2[i + segSource];
		targetData[i] = _byteArray2[i + segTarget];
	}	
	
	for(var i = 0; i < segLength; i++) {
		_byteArray2[segSource + i] = targetData[segTarget + i];
		_byteArray2[segTarget + i] = sourceData[segSource + i];
	}
	
	mainContext.globalCompositeOperation = 'source-over';
	mainContext.globalAlpha = (control7/200);
	var result2 = getImgBase64(_byteArray2);	
	mainContext.drawImage(result2,0,0);

	//document.getElementById("mainContext_link").href = mainContext.toDataURL();	
	
};

