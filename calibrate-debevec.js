// Create two vectors
const { Vector, Matrix } = linear_algebra;
const v1 = new Vector([1, 2, 3]);
const v2 = new Vector([4, 5, 6]);

// Perform vector operations
const sum = v1.add(v2);
const dotProduct = v1.dot(v2);

console.log('Vector sum:', sum);
console.log('Dot product:', dotProduct);

// CalibrateDebevec.js

class CalibrateDebevec {
    constructor(samples = 70, lambda = 10.0, random = false) {
        this.samples = samples;
        this.lambda = lambda;
        this.random = random;
    }

    setSamples(samples) {
        this.samples = samples;
    }

    setLambda(lambda) {
        this.lambda = lambda;
    }

    setRandom(random) {
        this.random = random;
    }

    calibrate(images, exposureTimes) {
        if (!Array.isArray(images) || images.length === 0 || images.length !== exposureTimes.length) {
            throw new Error("Invalid input: images and exposureTimes must be arrays of the same length.");
        }
        console.log("Calibrating using Debevec method...");

        let responseCurve = this._computeResponseCurve(images, exposureTimes);
        return responseCurve;
    }

    _computeResponseCurve(images, exposureTimes) {
        console.log("Computing response curve...");
        return {
            curve: "Sample response curve (replace with real implementation)"
        };
    }

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

