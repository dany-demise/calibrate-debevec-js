// Create two vectors
const { Vector, Matrix } = linear_algebra;
const v1 = new Vector([1, 2, 3]);
const v2 = new Vector([4, 5, 6]);

// Perform vector operations
const sum = v1.add(v2);
const dotProduct = v1.dot(v2);

console.log('Vector sum:', sum);
console.log('Dot product:', dotProduct);
