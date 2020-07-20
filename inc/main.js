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

/** The source canvas element. */
let srcCanvas;
/** The destination canvas element used to draw the final result to. */
let destCanvas;

/** Whether to print debug output to the browser console. */
const DEBUG_OUTPUT = true;

/**
 * Handles the main page load.
 */
function handlePageLoad() {
	srcCanvas = document.getElementById("src-canvas");
	destCanvas = document.createElement("canvas");

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
		destCanvas.width = img.naturalWidth;
		destCanvas.height = img.naturalHeight;

		srcContext.drawImage(img, 0, 0);
		krush();
	};

	img.setAttribute("crossOrigin", "anonymous");
	img.src = window.URL.createObjectURL(file);
}


/**
 * Loads a file to be krushed from a HTML image element.
 * This initialises the krush process.
 * @param {ImgElement} img - The HTML image to load.
 */
function loadFileFromImgElement(img)
{
	/** Canvas 2d drawing context. */
	const srcContext = srcCanvas.getContext("2d");

	srcCanvas.width = img.naturalWidth;
	srcCanvas.height = img.naturalHeight;
	destCanvas.width = img.naturalWidth;
	destCanvas.height = img.naturalHeight;

	srcContext.drawImage(img, 0, 0);

	krush();
}


/**
 * Gets all of the user-input control values.
 * @returns An object containing all of the control values.
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
			enabled: document.getElementById("control_slicer_enabled").value,
			segLength: document.getElementById("control_slicer_seg_length").value,
			iterations: document.getElementById("control_slicer_iterations").value
		},
		bitcrush: {
			enabled: document.getElementById("control_bitcrush_enabled").checked,
			threshold: document.getElementById("control_bitcrush_threshold").value,
			interval: document.getElementById("control_bitcrush_interval").value
		},
		delay: {
			enabled: document.getElementById("control_delay_enabled").checked,
			alpha: document.getElementById("control_delay_alpha").value,
			segLength: document.getElementById("control_delay_segLength").value
		}
	}
}


/**
 * Updates the 'value' for a particular control element.
 * This is triggered by the `onChange` event of an `input` element.
 * @param {HTMLElement} node - The triggering HTML element.
 */
function updateControlLabel(node)
{
	document.getElementById(`${node.id}_value`).innerHTML = node.value;
}


/**
 * @returns The computed interval value.
 */
function createRandomInterval(intervalMin,
	intervalScale)
{
	return intervalScale * (Math.random() + intervalMin) | 0;
}


/**
 * Image distortion function.
 * This image functions by randomly swapping bits within the image's binary data.
 * @param {Uint8ClampedArray} sourceImageData - The source image binary data.
 * @param {Number} jpegHeaderLength - The offset into the binary data of the first pixel data.
 * @param {Number} threshold - This value contols how likely each individual selected bit is
 * to be distorted by the process. This corresponds to a percentage chance for each byte
 * swap to occur.
 * @param {Number} intervalMin - The minimal offset between each byte to be swapped.
 * @param {Number} intervalScale - The scale of the offset distance between each swapped byte.
 * A smaller value will create more 'distortion'.
 * @returns A Uint8ClampedArray containing the distorted image data.
 */
function distort(sourceImageData,
	jpegHeaderLength,
	threshold,
	intervalMin,
	intervalScale)
{
	/** The image data to distort. */
	const imageData = Uint8ClampedArray.from(sourceImageData);
	/** The offset into the image data to distort. */
	let idx = jpegHeaderLength || 0;
	/** The number of distortions, for debugging. */
	let nDistortions = 0;
	/** The number of distortion passes, for debugging. */
	let nDistortionPasses = 0;

	while(idx < imageData.length) {
		nDistortionPasses++;

		if(Math.random() < (threshold / 10)) {
			imageData[idx] = (Math.random() * 255) | 0;
			nDistortions++;
		}

		idx += intervalMin + (Math.random() * intervalScale) | 0;
	}

	if(DEBUG_OUTPUT) {
		console.log(`Distort: Distortion passes: ${nDistortionPasses}`);
		console.log(`Distort: Distortions: ${nDistortions}`);
	}

	return imageData;
}


/**
 * This function swaps two random 'slices' of the image. The process is repeated as per
 * the specified number of iterations.
 * @param {Uint8ClampedArray} sourceImageData - The source image binary data.
 * @param {Number} jpegHeaderLength - The offset into the binary data of the first pixel data.
 * @param {Number} slicerIterations - The number of iterations for the process.
 * @param {Number} segmentLengthScale - This value controls the scale of each sliced segment.
 * A shorter value here will create more distortion.
 * @returns A Uint8ClampedArray containing the distorted image data.
 */
function slicer(sourceImageData,
	jpegHeaderLength,
	slicerIterations,
	segmentLengthScale)
{
	/** The image data to distort. */
	const imageData = Uint8ClampedArray.from(sourceImageData);

	for(let c = 0; c < slicerIterations | 0; c++) {
		/** The offset for the slice source. */
		let sliceSource = imageData.length;
		/** The offset for the slice target. */
		let sliceTarget = imageData.length;
		/** The length of each slice. */
		let sliceLength = ((Math.random() * 50) * segmentLengthScale) | 0;
		/** The source data for the slice. */
		let sourceData = null;
		/** The target data for the slice. */
		let targetData = null;

		while((sliceSource + sliceLength) > imageData.length) {
			// get random position without going out of bounds.
			sliceSource = jpegHeaderLength + (Math.random() * imageData.length) | 0;
		}

		while((sliceTarget + sliceLength) > imageData.length) {
			sliceTarget = jpegHeaderLength + (Math.random() * imageData.length) | 0;
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
 * A more aggressive image distortion.
 * @param {Uint8ClampedArray} sourceImageData - The source image binary data.
 * @param {Number} jpegHeaderLength - The offset into the binary data of the first pixel data.
 * @param {Number} threshold - This value contols how likely each individual selected bit is
 * to be distorted by the process. This corresponds to a percentage chance for each byte
 * swap to occur.
 * @param {Number} intervalScale - The scale of the offset distance between each swapped byte.
 * A smaller value will create more 'distortion'.
 * @returns A Uint8ClampedArray containing the distorted image data.
 */
function bitcrush(sourceImageData,
	jpegHeaderLength,
	threshold,
	intervalScale)
{
	/** Counter for the number of distortion passes. */
	let nDistortionPasses = 0;

	/** The image data to distort. */
	const imageData = Uint8ClampedArray.from(sourceImageData);

	/** The iterator for which byte to crush. */
	let i = jpegHeaderLength + createRandomInterval(20, intervalScale);
	do {
		if (Math.random() < (threshold / 100)) {
			imageData[i] = (Math.random() * 255) | 0;
			nDistortionPasses++;
		}

		i += createRandomInterval(20, intervalScale);
	} while(i < sourceImageData.length);

	if(DEBUG_OUTPUT) {
		console.log(`Bitcrush: Distortion passes: ${nDistortionPasses}`);
	}

	return imageData;
}


/**
 * @param {Uint8ClampedArray} sourceImageData - The source image binary data.
 * @param {Number} jpegHeaderLength - The offset into the binary data of the first pixel data.
 * @param {Number} delaySliceLength
 * @param {Number} delayAlpha
 * @returns A Uint8ClampedArray containing the distorted image data.
 */
function delay(sourceImageData,
	jpegHeaderLength,
	delaySliceLength,
	delayAlpha)
{
	/** The sliced image data */
	const slicedImageData = slicer(sourceImageData, jpegHeaderLength, 1, delaySliceLength);
	/** The HTML image element to hold the image data. */
	let img = new Image();

	img.onload = function () {
		/** Canvas 2d drawing context */
		const mainContext = destCanvas.getContext("2d");

		mainContext.globalCompositeOperation = "source-over";
		mainContext.globalAlpha = (delayAlpha / 200);
		mainContext.drawImage(img, 0, 0);
	};

	// Get image data as DataURL.
	img.src = createDataUrlFromBinaryData(slicedImageData);
}


/**
 * Initialises the image krushing process.
 * This function prepares the binary data and then calls `krushBinaryData`.
 */
function krush()
{
	srcCanvas.toBlob((blob) => {
		blob.arrayBuffer().then((arrayBuffer) => {
			krushBinaryData(arrayBuffer);
		}).catch((err) => {
			if(DEBUG_OUTPUT) {
				console.error(err);
			}

			const errorElement = document.getElementById("error-element");
			errorElement.innerText = "An error was encountered during the rendering process";
		});
	}, "image/jpeg", 1.0);
}


/**
 * Initialises the image krushing process.
 * @param {ArrayBuffer} binaryImageData - The binary image data.
 */
function krushBinaryData(binaryImageData)
{
	/** The user-input control values. */
	const control = getControlValues();
	/** The binary image data. */
	let imageData = new Uint8ClampedArray(binaryImageData);
	/** The JPEG header length. */
	let jpegHeaderLength = getJpegHeaderLength(imageData);
	/** Canvas 2d drawing context */
	const mainContext = destCanvas.getContext("2d");
	/** The image element to store the result in. */
	const resultImage = document.getElementById("result-image");

	mainContext.globalCompositeOperation = "source-over";
	mainContext.globalAlpha = 1;

	imageData = distort(imageData, jpegHeaderLength, control.distort.threshold,
		control.distort.intervalMin, control.distort.intervalMax);

	if(control.slicer.enabled) {
		imageData = slicer(imageData, jpegHeaderLength, control.slicer.iterations,
			control.slicer.segLength);
	}

	if(control.bitcrush.enabled) {
		imageData = bitcrush(imageData, jpegHeaderLength, control.bitcrush.threshold,
			control.bitcrush.interval);
	}

	/** The HTML image element to hold the crushed image data. */
	let img = new Image();

	// Render the processed image to the destination canvas.
	img.onload = function () {
		resultImage.onload = () => {
			if(control.delay.enabled) {
				delay(imageData, jpegHeaderLength, control.delay.segLength, control.delay.alpha);
			}
		};

		mainContext.drawImage(img, 0, 0);
		resultImage.src = destCanvas.toDataURL("image/png", 1);
	}

	// Get image data as DataURL.
	img.src = createDataUrlFromBinaryData(imageData);
}


/**
 * Finds the JPEG header length.
 * This is used to avoid clobbering the JPEG header.
 * @param {ByteArray} sourceImageData
 * @returns The JPEG header length, or 0 if it cannot be found.
 */
function getJpegHeaderLength(sourceImageData)
{
	/** The index in the JPEG file to check. */
	let idx = 0;

	while(idx < sourceImageData.length) {
		// Checks for the JPEG end of header bytes.
		if(sourceImageData[idx] == 255 && sourceImageData[idx + 1] == 218) {
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
 * Encodes binary data into a DataURL object, which can be used as an image's `src` attribute.
 * @param {ByteArray} sourceData - The source binary data.
 * @returns A base64 encoded image in string format.
 */
function createDataUrlFromBinaryData(sourceData)
{
	/** The binary data converted to a base64 string. */
	const base64String = Array.prototype.map.call(sourceData, (x) => String.fromCharCode(x)).join("");
	/** The base64 encoded image data. */
	const imageData = window.btoa(base64String);

	return "data:image/jpeg;base64," + imageData;
}
