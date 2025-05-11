import React, { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const HostRoom = ({ user }) => {
  const [gameCode, setGameCode] = useState('');
  const navigate = useNavigate();
    const { courseID, studentId } = useParams();
    const canvasRef = useRef(null);
    const VcontextRef = useRef(null);
    const strokesRef = useRef([]);
    const isDrawingRef = useRef(false);
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
    };
  



    





    useEffect(() => {
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
  
      const resize = () => {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
          const context = canvas.getContext('2d');
          context.lineCap = 'round';
          context.lineJoin = 'round';
          VcontextRef.current = context;
          showCanvas();
      }
      resize();
  
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }, []);
  
    const startDrawing = e => {
      const canvas = canvasRef.current;
      const { offsetX, offsetY } = e.nativeEvent;
      const xRel = offsetX/canvas.width;
      const yRel = offsetY/canvas.height;
      strokesRef.current.push({color, lineWidth, points: [{xRel,yRel}]});
      isDrawingRef.current = true;
    };
  
    const draw = e => {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current;
      const { offsetX, offsetY } = e.nativeEvent;
      const xRel = offsetX/canvas.width;
      const yRel = offsetY/canvas.height;
      const currStroke = strokesRef.current[strokesRef.current.length-1];
      currStroke.points.push({xRel,yRel});
      showCanvas();
    };
  
    const stopDrawing = () => {
      isDrawingRef.current = false;
    };
  
    const handleDownload = () => {
      const canvas = canvasRef.current;
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `whiteboard-${courseID || 'drawing'}.png`;
      link.click();
    };

  return (
    <div className = "whiteboardFull">
      <audio autoPlay loop>
        <source src="/Music/Piano Music.mp3" type="audio/mpeg" />
      </audio>
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
      
      <div className = 'download'>
        <button
            className='download-button'
            onClick={handleDownload}
        >
            Download as PNG
        </button>
      </div>
    </div>
  );
};

export default HostRoom;