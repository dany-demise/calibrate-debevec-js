const LDR_SIZE = 256;
const CHANNELS = 3;

class ImageRGB {
    constructor(array, width, height) {
        this.array = array;
        this.width = width;
        this.height = height;            
    }
    getAt(x, y) {
        const index = (y * this.width + x) * 3;
        return [
            this.array[index],     // Red component
            this.array[index + 1], // Green component
            this.array[index + 2]  // Blue component
        ];
    }
}

class PointRGB {
    constructor(RGB, x, y) {
        this.RGB = RGB
        this.x = x;
        this.y = y;
    }
    // Method to get the position of the point
    getPosition() {
        return { x: this.x, y: this.y };
    }
    getRGB() {
        return this.RGB;
    }
}

class CalibrateDebevec {
    /**
     * Creates an instance of CalibrateDebevec.
     * @param {number} [samples=70] - The number of samples to use.
     * @param {number} [lambda=10.0] - The regularization parameter.
     * @param {boolean} [random=false] - Whether to use random sampling.
     */
    constructor(samples = 70, lambda = 10.0, random = true) {
        /** @type {number} */
        this.samples = samples;
        /** @type {number} */
        this.lambda = lambda;
        /** @type {boolean} */
        this.random = random;
    }

    /**
     * Set the number of samples.
     * @param {number} samples - The new number of samples.
     */
    setSamples(samples) { this.samples = samples; }

    /**
     * Set the lambda (regularization) value.
     * @param {number} lambda - The new lambda value.
     */
    setLambda(lambda) { this.lambda = lambda; }

    /**
     * Set whether random sampling is used.
     * @param {boolean} random - True to use random sampling, false otherwise.
     */
    setRandom(random) { this.random = random; }

    /**
     * Calibrate the images using the Debevec method.
     * @param {Array<Array<ImageRGB>>} images - The array of images to calibrate, .
     * @param {Array<number>} exposureTimes - The array of corresponding exposure times.
     * @returns {Array<number>} The computed response curve.
     */
    process(images, exposureTimes) {
        const cols = images[0].width;
        const rows = images[0].height;
        console.log("Calibrating using Debevec method...");

        const pointsCoordinates = [];

        // Generate 50 random points within the dimensions of the first image
        const width = images[0].width;
        const height = images[0].height;

        for (let i = 0; i < this.samples; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            pointsCoordinates.push({ x, y });
        }

        // Generate points for each image using the same random coordinates
        const points = images.map(image => {
            return pointsCoordinates.map(({ x, y }) => {
                const RGB = image.getAt(x, y);
                return new PointRGB(RGB, x, y);
            });
        });

        console.log(points)

        // return responseCurve;
    }

}


// Function to convert File object to RGB matrices
async function fileObjectToImageRgb(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        // Load the image from the File object
        reader.onload = function(e) {
            img.src = e.target.result;
        };

        img.onload = function() {
            try {
                // Create a canvas to draw the image
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);

                // Get image data from the canvas
                const imageData = context.getImageData(0, 0, img.width, img.height);
                const data = imageData.data; // Pixel data array

                const width = img.width;
                const height = img.height;

                let theImage = new ImageRGB(data, width, height);

                resolve(theImage);

            } catch (error) {
                alert('An error occurred while processing the image: ' + error.message);
                reject(error);
            }
            
        };

        img.onerror = function() {
            const errorMessage = 'Error loading image ' + file.name;
            alert(errorMessage);
            reject(new Error(errorMessage));
        };

        // Read the file as a Data URL
        reader.onerror = function() {
            const errorMessage = 'Error reading file ' + file.name;
            alert(errorMessage);
            reject(new Error(errorMessage));
        };

        reader.readAsDataURL(file);
    });
}
