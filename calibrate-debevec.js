/**
 * Vector and Matrix classes from the linear_algebra module.
 * @typedef {Object} Vector
 * @typedef {Object} Matrix
 */
const { Vector, Matrix } = linear_algebra;

/** @type {Vector} v1 - A vector with values [1, 2, 3] */
const v1 = new Vector([1, 2, 3]);

/** @type {Vector} v2 - A vector with values [4, 5, 6] */
const v2 = new Vector([4, 5, 6]);

/** @type {Vector} sum - The sum of v1 and v2 */
const sum = v1.add(v2);

/** @type {number} dotProduct - The dot product of v1 and v2 */
const dotProduct = v1.dot(v2);

console.log('Vector sum:', sum);
console.log('Dot product:', dotProduct);

/**
 * Class representing the CalibrateDebevec algorithm.
 */
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
     * @param {Array<Array<Matrix>>} images - The array of images to calibrate, .
     * @param {Array<number>} exposureTimes - The array of corresponding exposure times.
     * @returns {Object} The computed response curve.
     * @throws {Error} If images and exposureTimes are not arrays of the same length.
     */
    calibrate(images, exposureTimes) {
        if (!Array.isArray(images) || images.length === 0 || images.length !== exposureTimes.length) {
            throw new Error("Invalid input: images and exposureTimes must be arrays of the same length.");
        }
        console.log("Calibrating using Debevec method...");

        let responseCurve = this._computeResponseCurve(images, exposureTimes);
        return responseCurve;
    }

    /**
     * Private method to compute the response curve.
     * @param {Array} images - The array of images.
     * @param {Array<number>} exposureTimes - The array of exposure times.
     * @returns {Object} A dummy response curve (replace with real implementation).
     * @private
     */
    _computeResponseCurve(images, exposureTimes) {
        console.log("Computing response curve...");
        return {
            curve: "Sample response curve (replace with real implementation)"
        };
    }

    /**
     * Get the current calibration parameters.
     * @returns {Object} The current parameters including samples, lambda, and random.
     */
    getParams() {
        return {
            samples: this.samples,
            lambda: this.lambda,
            random: this.random
        };
    }
}

// Use `export default` to export the class in ES6 style
export default CalibrateDebevec;
