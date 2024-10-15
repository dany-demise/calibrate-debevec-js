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
         this.array[index], // Red component
         this.array[index + 1], // Green component
         this.array[index + 2] // Blue component
      ];
   }
}

class PointRGB {
   constructor(RGB, x, y) {
      this.RGB = RGB // such that is an Array on integers [128, 128, 128]
      this.x = x;
      this.y = y;
   }
   // Method to get the psition of the point
   getPosition() {
      return [ this.x, this.y ];
   }
   getRGB() {
      return this.RGB;
   }
}

class PolynomialResponseFunction {
   // Models the function as a 5 deg. polynomial
   constructor([a,b,c,d,e,f]) {
      this.expStr = `${a}*x^5+${b}*x^4+${c}*x^3+${d}*x^2+${e}*x+${f}`;
      console.log(this.expStr);
      this.evalOne = math.compile(this.expStr).evaluate;
      // this.derivEvalOne = math.derivative(this.expStr).evaluate;
      this.coeffs = [a,b,c,d,e,f];
   }

   eval(X) {
      console.log(X);
      return X.map(this.evalOne);
   }

   // derivEval(X) {
   //    return X.map(this.derivEvalOne);
   // }
   
   lossGradients(Y_real) {
      console.log(Y_real);
      let lossGradientsValues = [];
      for (const exponent in this.coeffs) {
          let coeff = this.coeffs[exponent];
          let N = this.coeffs.length;
          let lossGradient = 0.0;
          for (const i in Y_real) {
             console.log(i);
             lossGradient += Y_real[i] - this.evalOne({x:i}) * i ** exponent;
          }
          lossGradient = -2 / N * lossGradient;
          lossGradientsValues.push(lossGradient);
      }
      return lossGradientsValues;
   }
   
}

class CalibrateDebevec {
   /**
    * Creates n instance of CalibrateDebevec.
    * @param {number} [samples=70] - The number of samples to use.
    * @param {number} [lambda=20.0] - The regularization parameter.
    * @param {boolean} [random=false] - Whether to use random sampling.
    */
   constructor(samples = 70, lambda = 10.0, random = false) {
      this.samples = samples;
      this.lambda = lambda;
      this.random = random;
   }

   
   /**
    * Calibrate the images using the Debevec method.
    * @param {Array<Array<ImageRGB>>} images - The array of images to calibrate, .
    * @param {Array<number>} exposureTimes - The array of corresponding exposure times.
    * @returns {Array<number>} The computed response curve.
    */
   process(images, exposureTimes) {
      console.log("Calibrating using Debevec method...");

      const pointsCoordinates = [];

      // Generate 50 random points within the dimensions of the first image
      const width = images[0].width;
      const height = images[0].height;

      if (this.random) {
      for (let i = 0; i < this.samples; i++) {
         const x = Math.floor(Math.random() * width);
         const y = Math.floor(Math.random() * height);
         pointsCoordinates.push({ x, y });
      }
      }
      else {
          let samples = this.samples;
          let cols = width;
          let rows = height;
          let xPoints = Math.floor(Math.sqrt(samples * cols / rows));
          let yPoints = Math.floor(samples / xPoints);
          let stepX = Math.floor(cols / xPoints);
          let stepY = Math.floor(rows / yPoints);

          for (let i = 0, x = Math.floor(stepX / 2); i < xPoints; i++, x += stepX) {
             for (let j = 0, y = Math.floor(stepY / 2); j < yPoints; j++, y += stepY) {
                 if (x >= 0 && x < cols && y >= 0 && y < rows) {
                     pointsCoordinates.push({ x, y });
                  }
              }
        }
      }

      // Generate points for each image using the same random coordinates
      const points = images.map(image => {
         return pointsCoordinates.map(({ x, y }) => {
            const RGB = image.getAt(x, y);
            return new PointRGB(RGB, x, y);
         });
      });

      console.log(points);

      // Process each channel separately
      let responseCurvesResult = this.getResponseCurves(images, exposureTimes, points, this.lambda);

      return responseCurvesResult;

   }

   triangleWeights(value) {
      // Custom weight function for each intensity level (0 to 255)
      // Example weight: a triangular weighting centered around 128
      return Math.max(0, 1 - Math.abs((value - 128) / 128));
      // return 1.0 / 256.0;
   }

   // Build the system of equations for one channel
   getResponseCurves(images, exposureTimes, points, lambda) {
      const n = points.length * images.length + LDR_SIZE + 1;

      let responseCurves = [] // Should be 3 array of 256 vlues at the end

      for (let channel = 0; channel < CHANNELS; channel++) {
         let A = math.zeros([n, LDR_SIZE + points.length]);
         let B = math.zeros([n, 1]);

         let k = 0;
         for (let i = 0; i < points.length; i++) {
            for (let j = 0; j < images.length; j++) {
               const [x, y] = points[j][i].getPosition();
               const val = 1.0 * images[j].getAt(x, y)[channel]; // Access the channel value
               const weight = this.triangleWeights(val);

               A = math.subset(A, math.index(k, val), weight);
               A = math.subset(A, math.index(k, LDR_SIZE + i), -weight);
               B = math.subset(B, math.index(k, 0), weight * Math.log(exposureTimes[j]));
               k++;
            }
         }
         // fix the curve by setting its middle value to 0
         A = math.subset(A, math.index(k, LDR_SIZE / 2), 1.0);
         k++;

         // Smoothness equations
         for (let i = 0; i < LDR_SIZE - 2; i++) {
            const weight = this.triangleWeights(i + 1);
            A = math.subset(A, math.index(k, i), lambda * weight);
            A = math.subset(A, math.index(k, i + 1), -2 * lambda * weight);
            A = math.subset(A, math.index(k, i + 2), lambda * weight);
            k++;
         }

         // Right singular vectors (n x n)
         // const { Matrix, SVD, QR } = mlMatrix;
         // const svd = new SVD(new Matrix(A));

         // const logResponseCurve = solve....
         let logResponseCurvePolynomial = new PolynomialResponseFunction([1.0, 1.0, 1.0, 1.0, 1.0, 0.0]);
         let delta = 0.01;
         for (let epoch = 0; epoch < 1000; epoch++) {
            let new_coeffs = math.subtract(
               math.matrix(logResponseCurvePolynomial.coeffs),
               math.multiply(
                  delta, 
                  math.matrix(logResponseCurvePolynomial.lossGradients(B))
               )
            );
            console.log(new_coeffs);
            logResponseCurvePolynomial = new PolynomialResponseFunction(new_coeffs);
         }
         let range = Array.from({ length: B.to2DArray().length }, (_, i) => i);
         let logResponseCurve = range.map(logResponseCurvePolynomial.eval);
         let responseCurve = logResponseCurve.map(value => Math.exp(value[0]));
         console.log('Solution x:', responseCurve.slice(0, LDR_SIZE));
         responseCurves.push(responseCurve.slice(0, LDR_SIZE));
      }
      return responseCurves;
   }
}


// Function to convert DOM File object to ImageRGB object
async function fileObjectToImageRgb(file) {
   return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      // Load the image from the File object
      reader.onload = function (e) {
         img.src = e.target.result;
      };

      img.onload = function () {
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

      img.onerror = function () {
         const errorMessage = 'Error loading image ' + file.name;
         alert(errorMessage);
         reject(new Error(errorMessage));
      };

      // Read the file as a Data URL
      reader.onerror = function () {
         const errorMessage = 'Error reading file ' + file.name;
         alert(errorMessage);
         reject(new Error(errorMessage));
      };

      reader.readAsDataURL(file);
   });
}
