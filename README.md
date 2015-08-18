# jpk

live demo available at: http://ajxs.github.io/jpk/

JPEGKrusher is part of my various experiments in procedural image generation and computer-art. A simple app to create glitch-art by introducing arbitrary corruption in the JPEG compression within images. It functions by altering the bits within the binary data of a JPEG encoded file along arbitrary parameters. The controls available will have various effects upon the resulting image.
Controls 1-3 adjust the amount of binary distortion applied to the image, control1 and 2 adjust the min/max interval the file pointer moves between bits to corrupt. Control3 is the threshold for the percentage chance for the bit at the file pointer position being corrupted.
Controls 4-6 are a slicing mechanism, which will shift certain rows of the image across the image itself. Creating a 'jumbled','sliced' effect, where the image appears to be displayed out of order.
Controls 7-8 adjust whether or not a further corrupted version of the image is overlaid ontop of the resulting image. Controlling the opacity and resulting effect.

Feel free to report any suggestions, issues or forks to ajxscc [at] gmail.com
