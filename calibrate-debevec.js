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
   // Method to get the position of the point
   getPosition() {
      return [ this.x, this.y ];
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
   constructor(samples = 1000, lambda = 10.0, random = false) {
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
               const val = images[j].getAt(x, y)[channel]; // Access the channel value
               const weight = this.triangleWeights(val);

               A = math.subset(A, math.index(k, val), weight);
               A = math.subset(A, math.index(k, LDR_SIZE + i), -weight);
               B = math.subset(B, math.index(k, 0), weight * Math.log(exposureTimes[j]));
               k++;
            }
         }
         // fix the curve by setting its middle value to 0
         A = math.subset(A, math.index(k, LDR_SIZE / 2), 1);
         k++;

         // Smoothness equations
         for (let i = 0; i < LDR_SIZE - 2; i++) {
            const weight = this.triangleWeights(i + 1);
            A = math.subset(A, math.index(k, i), lambda * weight);
            A = math.subset(A, math.index(k, i + 1), -2 * lambda * weight);
            A = math.subset(A, math.index(k, i + 2), lambda * weight);
            k++;
         }

         // Perform Singular Value Decomposition on A
         const svd = SVD(A);

         // Extract U, S, and V matrices
         const U = svd.u;       // Left singular vectors (m x m)
         const S = svd.q;       // Singular values (array of length n)
         const V = svd.v;       // Right singular vectors (n x n)

         // Compute the pseudoinverse of S
         const S_inv = math.diag(S.map(s => s > 1e-10 ? 1 / s : 0));

         // Compute the pseudoinverse of A: A_pinv = V * S_inv * U^T
         const V_S_inv = math.multiply(V, S_inv);
         const A_pinv = math.multiply(V_S_inv, math.transpose(U));

         // Solve for x: x = A_pinv * B
         const logResponseCurve = math.multiply(A_pinv, B);
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
