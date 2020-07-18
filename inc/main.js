/**
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

"use strict";

let srcCanvas;
let mainCanvas;

/** Whether to print debug output to the browser console. */
const DEBUG_OUTPUT = true;

/**
 * Main
 */
function main_init() {
	srcCanvas = document.getElementById("src-canvas");
	mainCanvas = document.createElement("canvas");


	loadFileFromImgElement(document.getElementById("img_5"));
}


/**
 * Handles 'upload file' element click.
 * This triggers the opening of the file selection dialog.
 */
function openFileSelectDialog() {
	document.getElementById("file-input").click();
}


/**
 * Handles file selection.
 * This begins the krush process.
 * @param {File} file
 */
function handleFileSelect(file) {
	if(!file.type.match("image.*")) {
		return false;
	}

	/** Image element to contain the loaded image. */
	let img = new Image();
	img.onload = function () {
		/** Canvas 2d drawing context. */
		const srcContext = srcCanvas.getContext("2d");

		srcCanvas.width = img.naturalWidth;
		srcCanvas.height = img.naturalHeight;
		mainCanvas.width = img.naturalWidth;
		mainCanvas.height = img.naturalHeight;

		srcContext.drawImage(img, 0, 0);
		crush();
	};

	img.setAttribute("crossOrigin", "anonymous");
	img.src = window.URL.createObjectURL(file);
}


/**
 * Loads a file to be krushed from a HTML image element.
 * This begins the krush process.
 * @param {ImgElement} img - The HTML image to load.
 */
function loadFileFromImgElement(img)
{
	/** Canvas 2d drawing context. */
	const srcContext = srcCanvas.getContext("2d");

	srcCanvas.width = img.naturalWidth;
	srcCanvas.height = img.naturalHeight;
	mainCanvas.width = img.naturalWidth;
	mainCanvas.height = img.naturalHeight;

	srcContext.drawImage(img, 0, 0);
	crush();
}


/**
 *
 */
function getControlValues()
{
	return {
		distort: {
			intervalMin: document.getElementById("control_distort_interval_min").value,
			intervalMax: document.getElementById("control_distort_interval_max").value,
			threshold: document.getElementById("control_distort_threshold").value
		},
		slicer: {
			segLength: document.getElementById("control_slicer_seg_length").value,
			iterations: document.getElementById("control_slicer_iterations").value
		},
		bitcrush: {
			enabled: document.getElementById("control_bitcrush").checked,
			threshold: document.getElementById("control_bitcrush_threshold").value,
			interval: document.getElementById("control_bitcrush_interval").value
		},
		delay: {
			alpha: document.getElementById("control_delay_alpha").value,
			segLength: document.getElementById("control_delay_segLength").value
		}
	}
}


function updateControlLabel(node)
{
	document.getElementById(`${node.id}_value`).innerHTML = node.value;
}


function distort(_byteArray,
	_headerLength,
	_threshold,
	_intervalMin,
	_intervalMax)
{
	/** The image data to distort. */
	const imageData = Uint8Array.from(_byteArray);
	/** The offset into the image data to distort. */
	let idx = _headerLength || 0;
	/** The number of distortions, for debugging. */
	let nDistortions = 0;
	/** The number of distortion passes, for debugging. */
	let nDistortionPasses = 0;

	while(idx < imageData.length) {
		nDistortionPasses++;

		if(Math.random() < (_threshold / 10)) {
			imageData[idx] = (Math.random() * 255) | 0;
			nDistortions++;
		}

		idx += _intervalMin + (Math.random() * _intervalMax) | 0;
	}

	if(DEBUG_OUTPUT) {
		console.log(`Distort: Distortion passes: ${nDistortionPasses}`);
		console.log(`Distort: Distortions: ${nDistortions}`);
	}

	return imageData;
}


/**
 *
 * @param {*} _byteArray
 * @param {*} _iterations
 * @param {*} _segLengthModifier
 */
function slicer(_byteArray,
	_iterations,
	_segLengthModifier)
{
	/** The image data to distort. */
	const imageData = Uint8Array.from(_byteArray);

	for(let c = 0; c < _iterations | 0; c++) {
		/** The offset for the slice source. */
		let sliceSource = imageData.length;
		/** The offset for the slice target. */
		let sliceTarget = imageData.length;
		/** The length of each slice. */
		let sliceLength = ((Math.random() * 50) * _segLengthModifier) | 0;
		/** The source data for the slice. */
		let sourceData = null;
		/** The target data for the slice. */
		let targetData = null;

		while((sliceSource + sliceLength) > imageData.length) {
			// get random position without going out of bounds.
			sliceSource = (Math.random() * imageData.length) | 0;
		}

		while((sliceTarget + sliceLength) > imageData.length) {
			sliceTarget = (Math.random() * imageData.length) | 0;
		}

		if(DEBUG_OUTPUT) {
			console.log(`Slicer: segment source: ${sliceSource}`);
			console.log(`Slicer: segment target: ${sliceTarget}`);
			console.log(`Slicer: segment length: ${sliceLength}`);
		}

		sourceData = imageData.subarray(sliceSource, sliceSource + sliceLength);
		targetData = imageData.subarray(sliceTarget, sliceTarget + sliceLength);

		for(let i = 0; i < sliceLength; i++) {
			imageData[sliceSource + i] = targetData[sliceTarget + i];
			imageData[sliceTarget + i] = sourceData[sliceSource + i];
		}
	}

	return imageData;
}


/**
 *
 * @param {*} _byteArray
 * @param {*} _headerLength
 * @param {*} _threshold
 * @param {*} _interval
 */
function bitcrush(_byteArray,
	_headerLength,
	_threshold,
	_interval)
{
	/** Counter for the number of distortion passes. */
	let nDistortionPasses = 0;

	/**
	 * @returns The computed interval value.
	 */
	function getInterval() {
		/** The interval minimum. */
		const intervalMin = 20;

		return _interval * (Math.random() + intervalMin) | 0;
	}

	/** The image data to distort. */
	const imageData = Uint8Array.from(_byteArray);

	/** The iterator for which byte to crush. */
	let i = _headerLength + getInterval();
	do {
		if (Math.random() < (_threshold / 100)) {
			imageData[i] = (Math.random() * 255) | 0;
			nDistortionPasses++;
		}

		i += getInterval();
	} while(i < _byteArray.length);

	if(DEBUG_OUTPUT) {
		console.log(`Bitcrush: Distortion passes: ${nDistortionPasses}`);
	}

	return imageData;
}


/**
 *
 * @param {*} _byteArray
 * @param {*} _segLength
 * @param {*} _alpha
 */
function delay(_byteArray,
	_segLength,
	_alpha)
{
	/** The sliced image data */
	const slicedImageData = slicer(_byteArray, 1, _segLength);
	/** The HTML image element to hold the image data. */
	let img = new Image();

	img.onload = function () {
		/** Canvas 2d drawing context */
		const mainContext = mainCanvas.getContext("2d");

		mainContext.globalCompositeOperation = "source-over";
		mainContext.globalAlpha = (_alpha / 200);
		mainContext.drawImage(img, 0, 0);
	};

	// Get image data as DataURL.
	img.src = createDataUrlFromBinaryData(slicedImageData);
}


function crush()
{
	/** The user-input control values. */
	const control = getControlValues();
	/** The binary image data. */
	let imageData = base64toBinary(srcCanvas.toDataURL("image/jpeg", 1.0));
	/** The JPEG header length. */
	let jpegHeaderLength = getJpegHeaderLength(imageData);
	/** Canvas 2d drawing context */
	const mainContext = mainCanvas.getContext("2d");
	/** The image element to store the result in. */
	const resultImage = document.getElementById("result-image");

	mainContext.globalCompositeOperation = "source-over";
	mainContext.globalAlpha = 1;

	imageData = distort(imageData, jpegHeaderLength, control.distort.threshold,
		control.distort.intervalMin, control.distort.intervalMax);

	if(control.slicer.iterations > 0) {
		imageData = slicer(imageData, control.slicer.iterations, control.slicer.segLength);
	}

	if(control.bitcrush.enabled) {
		imageData = bitcrush(imageData, jpegHeaderLength, control.bitcrush.threshold,
			control.bitcrush.interval);
	}

	/** The HTML image element to hold the crushed image data. */
	let img = new Image();

	img.onload = function () {
		mainContext.drawImage(img, 0, 0);
		delay(imageData, control.delay.segLength, control.delay.alpha);

		resultImage.src = mainCanvas.toDataURL("image/png", 1);
	}

	// Get image data as DataURL.
	img.src = createDataUrlFromBinaryData(imageData);
}


/**
 * Finds the JPEG header length.
 * @param {ByteArray} _byteArray
 * @returns The JPEG header length, or 0 if it cannot be found.
 */
function getJpegHeaderLength(_byteArray)
{
	/** The index in the JPEG file to check. */
	let idx = 0;

	while(idx < _byteArray.length) {
		// Checks for the JPEG end of header bytes.
		if(_byteArray[idx] == 255 && _byteArray[idx + 1] == 218) {
			if(DEBUG_OUTPUT) {
				console.log(`JPEG header length: ${idx}`);
			}

			return idx + 2;
		}

		idx++;
	}

	if(DEBUG_OUTPUT) {
		console.log(`JPEG header length not found`);
	}

	return 0;
}


/**
 * encode binary to ascii
 * @param {ByteArray} sourceData
 */
function createDataUrlFromBinaryData(sourceData)
{
	/** The binary data converted to a base64 string. */
	const base64String = Array.prototype.map.call(sourceData, (x) => String.fromCharCode(x)).join("");
	/** The base64 encoded image data. */
	const imageData = window.btoa(base64String);

	return "data:image/jpeg;base64," + imageData;
}


/**
 *
 * @param {} dataURI
 * @returns A Uint8 array containing the image data.
 */
function base64toBinary(dataURI) {
	/** The binary string stripped of its base64 encoding marker. */
	const base64String = window.atob(dataURI.substring(dataURI.indexOf(";base64,") + 8));
	/** The base64 string converted to a string of bytes. */
	const binaryString = Array.prototype.map.call(base64String, (x) => x.charCodeAt(0));

	// Convert the binary string to a Uint8 clamped array.
	return Uint8ClampedArray.from(binaryString);
}
