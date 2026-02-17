import { useState, useRef, useEffect } from "react";
import { 
  Palette, 
  Eraser, 
  RotateCcw, 
  Download, 
  Upload, 
  Minus, 
  Plus, 
  Square, 
  Circle, 
  Type,
  X,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DigitalWhiteboard({ isOpen, onClose, meetingId }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // pen, eraser, rectangle, circle, text
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Drawing state
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isShapeDrawing, setIsShapeDrawing] = useState(false);

  // Text tool state
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [showTextInput, setShowTextInput] = useState(false);

  // Available colors
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
  ];

  // Initialize canvas
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;
      
      // Set default styles
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Save initial state
      saveToHistory();
    }
  }, [isOpen]);

  // Save canvas state to history
  const saveToHistory = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Get mouse position relative to canvas
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Start drawing
  const startDrawing = (e) => {
    if (!canvasRef.current) return;
    
    const pos = getMousePos(e);
    const ctx = canvasRef.current.getContext('2d');
    
    if (tool === 'text') {
      setTextPosition(pos);
      setShowTextInput(true);
      return;
    }
    
    setIsDrawing(true);
    setStartPos(pos);
    
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else if (tool === 'rectangle' || tool === 'circle') {
      setIsShapeDrawing(true);
    }
  };

  // Continue drawing
  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const pos = getMousePos(e);
    const ctx = canvasRef.current.getContext('2d');
    
    if (tool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  // Stop drawing
  const stopDrawing = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const pos = getMousePos(e);
    const ctx = canvasRef.current.getContext('2d');
    
    if (tool === 'rectangle') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.strokeRect(
        startPos.x, 
        startPos.y, 
        pos.x - startPos.x, 
        pos.y - startPos.y
      );
    } else if (tool === 'circle') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      const radius = Math.sqrt(
        Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
      );
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    setIsDrawing(false);
    setIsShapeDrawing(false);
    saveToHistory();
  };

  // Add text to canvas
  const addText = () => {
    if (!textInput.trim() || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = color;
    ctx.font = `${brushSize * 6}px Arial`;
    ctx.fillText(textInput, textPosition.x, textPosition.y);
    
    setTextInput('');
    setShowTextInput(false);
    saveToHistory();
  };

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      restoreFromHistory(historyIndex - 1);
    }
  };

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      restoreFromHistory(historyIndex + 1);
    }
  };

  // Restore canvas from history
  const restoreFromHistory = (index) => {
    if (!canvasRef.current || !history[index]) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    
    img.src = history[index];
  };

  // Clear canvas
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
    toast.success("Whiteboard cleared");
  };

  // Save whiteboard
  const saveWhiteboard = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `whiteboard-${meetingId || 'session'}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast.success("Whiteboard saved!");
  };

  // Load image to whiteboard
  const loadImage = (e) => {
    const file = e.target.files[0];
    if (!file || !canvasRef.current) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveToHistory();
        toast.success("Image loaded to whiteboard");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] max-w-6xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Palette className="w-6 h-6 text-blue-600" />
            Digital Whiteboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b bg-gray-50 flex-wrap">
          {/* Tools */}
          <div className="flex items-center gap-1 border-r pr-2">
            <Button
              variant={tool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('pen')}
              title="Pen"
            >
              <Palette className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('eraser')}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('rectangle')}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('circle')}
              title="Circle"
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('text')}
              title="Text"
            >
              <Type className="w-4 h-4" />
            </Button>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1 border-r pr-2">
            {colors.map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded border-2 ${
                  color === c ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                title={`Color: ${c}`}
              />
            ))}
          </div>

          {/* Brush Size */}
          <div className="flex items-center gap-2 border-r pr-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBrushSize(Math.max(1, brushSize - 1))}
              disabled={brushSize <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-8 text-center">{brushSize}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBrushSize(Math.min(20, brushSize + 1))}
              disabled={brushSize >= 20}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              title="Clear All"
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={saveWhiteboard}
              title="Save Whiteboard"
            >
              <Save className="w-4 h-4" />
            </Button>
            <label className="cursor-pointer">
              <Button
                variant="outline"
                size="sm"
                title="Load Image"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4" />
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={loadImage}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-4 bg-gray-100 relative">
          <div className="w-full h-full bg-white rounded border shadow-inner relative">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            
            {/* Text Input Overlay */}
            {showTextInput && (
              <div
                className="absolute bg-white border rounded p-2 shadow-lg"
                style={{
                  left: textPosition.x,
                  top: textPosition.y,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addText()}
                  placeholder="Enter text..."
                  className="border rounded px-2 py-1 text-sm"
                  autoFocus
                />
                <div className="flex gap-1 mt-1">
                  <Button size="sm" onClick={addText}>Add</Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setShowTextInput(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
          <p>💡 Tips: Use pen tool to draw freely, shapes for geometric figures, and text tool to add labels. Save your work before closing!</p>
        </div>
      </div>
    </div>
  );
}