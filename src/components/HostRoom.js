import React, { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import '../App.css';

const HostRoom = ({ user }) => {
    const canvasRef = useRef(null);
    const VcontextRef = useRef(null);
    const strokesRef = useRef([]);
    const isDrawingRef = useRef(false);
    const [isErasing, setIsErasing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
  
    const showCanvas = () => {
      
      const canvas = canvasRef.current;
      const visible = VcontextRef.current;
      if (!visible)return;
      visible.clearRect(0,0,canvas.width, canvas.height);
      strokesRef.current.forEach(stroke => {
          const { color: strokeColor, lineWidth: strokeWidth, points } = stroke;
          if(!points || points.length < 2) return;
          visible.beginPath();
          visible.strokeStyle = strokeColor;
          visible.lineWidth = strokeWidth;
          visible.moveTo(
              points[0].xRel*canvas.width,
              points[0].yRel*canvas.height
          );
          points.forEach(({xRel, yRel}) => {
              visible.lineTo(xRel * canvas.width, yRel * canvas.height);
          });
          visible.stroke();
      });

      strokesRef.current.forEach(stroke => {
        const { type, color: strokeColor, lineWidth: strokeWidth, points } = stroke;
        if (!points || points.length < 2) return;
        visible.beginPath();
      
        visible.globalCompositeOperation = type === 'eraser' ? 'destination-out' : 'source-over';
        visible.strokeStyle = type === 'eraser' ? 'rgba(0,0,0,1)' : strokeColor;
        visible.lineWidth = strokeWidth;
      
        visible.moveTo(points[0].xRel * canvas.width, points[0].yRel * canvas.height);
        points.forEach(({ xRel, yRel }) => {
          visible.lineTo(xRel * canvas.width, yRel * canvas.height);
        });
      
        visible.stroke();
      });
    };

    const handleUndo = () => {
      if (strokesRef.current.length === 0) return;
    
      strokesRef.current.pop();
    
      const canvas = canvasRef.current;
      const ctx = VcontextRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    
      showCanvas();
    };
    

    useEffect(() => {
      const canvas = canvasRef.current;
    
      const fixedWidth = 800;
      const fixedHeight = 600;
      canvas.width = fixedWidth;
      canvas.height = fixedHeight;
      // let history = [];
      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.lineJoin = 'round';
      VcontextRef.current = context;
    
      showCanvas();
    }, []);
    
  
    const startDrawing = e => {
      const canvas = canvasRef.current;
      const ctx = VcontextRef.current;
      const { offsetX, offsetY } = e.nativeEvent;
      const xRel = offsetX / canvas.width;
      const yRel = offsetY / canvas.height;
    
      if (isErasing) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = lineWidth;
      
        strokesRef.current.push({
          type: 'eraser',
          color: 'rgba(0,0,0,1)',
          lineWidth,
          points: [{ xRel, yRel }]
        });
      } else {
        ctx.globalCompositeOperation = 'source-over';
        strokesRef.current.push({
          type: 'pen',
          color,
          lineWidth,
          points: [{ xRel, yRel }]
        });
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
      }      
    
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      isDrawingRef.current = true;
    };

    
  
    const draw = e => {
      if (!isDrawingRef.current) return;

      const canvas = canvasRef.current;
      const ctx = VcontextRef.current;
      const { offsetX, offsetY } = e.nativeEvent;
      const xRel = offsetX / canvas.width;
      const yRel = offsetY / canvas.height;
    
      const currStroke = strokesRef.current[strokesRef.current.length - 1];
    
      if (isErasing) {
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
        if (currStroke && currStroke.type === 'eraser') {
          currStroke.points.push({ xRel, yRel });
        }
      } else {
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
        if (currStroke) {
          currStroke.points.push({ xRel, yRel });
        }
      }
    };
    
  
    const stopDrawing = () => {
      isDrawingRef.current = false;
    };

    

  return (
    <div className = "whiteboardFull">
      {/* <audio autoPlay loop>
        <source src="/Music/Piano Music.mp3" type="audio/mpeg" />
      </audio> */}
      <h2>Whiteboard</h2>
      <div className = "controls">
        <label>
          Color:
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <label>
          Line Width:
          <input
            type="range"
            min="1"
            max="100"
            value={lineWidth}
            onChange={(e) => setLineWidth(e.target.value)}
          />
          <span>{lineWidth}</span>
        </label>
          <button onClick={() => setIsErasing(false)}
            className={`undo ${isErasing ? '' : 'active'}`}
          >
            <img src="/images/pen.png" width="30" height="30" />
          </button>
          <button onClick={() => setIsErasing(true)}
            className={`undo ${isErasing ? 'active' : ''}`}
          
          >
            <img src="/images/eraser.png" width="30" height="30"/>
          </button>
          <button onClick={handleUndo} className="undo">
            <img src="/images/undo.png" width="30" height="30" />
          </button>
          </div>

      <div className = "canvas">
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
};

export default HostRoom;