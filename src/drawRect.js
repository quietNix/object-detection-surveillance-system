export const drawRect = (detections, ctx) =>{
  // Loop through each prediction

  detections.forEach(prediction => {

    // Extract boxes and classes
    const [x, y, width, height] = prediction['bbox']; 
    const text = prediction['class'].toUpperCase(); 

    // Set styling
    ctx.lineWidth = 1;
    ctx.strokeStyle = "yellow"
    ctx.font = '18px Arial';
    ctx.fillStyle = 'red';

    // Draw rectangles and text
    ctx.beginPath();   
    ctx.fillText(text, x, y-5);
    ctx.rect(x, y, width, height); 
    ctx.stroke();
  });
}
