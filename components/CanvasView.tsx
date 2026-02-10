import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface CanvasViewProps {
  children: React.ReactNode;
}

const CanvasView: React.FC<CanvasViewProps> = ({ children }) => {
  const transformFunctionsRef = React.useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetTransform: () => void;
    centerView: () => void;
  } | null>(null);

  return (
    <div className="relative w-full h-full bg-aegis-bg overflow-visible">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-aegis-panel border border-aegis-border rounded-lg p-2 shadow-lg">
        <button
          onClick={() => transformFunctionsRef.current?.zoomIn()}
          className="p-2 hover:bg-white/5 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={18} className="text-gray-400" />
        </button>
        <button
          onClick={() => transformFunctionsRef.current?.zoomOut()}
          className="p-2 hover:bg-white/5 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={18} className="text-gray-400" />
        </button>
        <div className="h-px bg-aegis-border my-1"></div>
        <button
          onClick={() => transformFunctionsRef.current?.centerView()}
          className="p-2 hover:bg-white/5 rounded transition-colors"
          title="Fit to View"
        >
          <Maximize2 size={18} className="text-gray-400" />
        </button>
        <button
          onClick={() => transformFunctionsRef.current?.resetTransform()}
          className="p-2 hover:bg-white/5 rounded transition-colors"
          title="Reset View"
        >
          <RotateCcw size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Canvas with Zoom/Pan */}
      <TransformWrapper
        initialScale={1}
        minScale={0.3}
        maxScale={3}
        wheel={{ step: 0.1 }}
        pan={{ disabled: false }}
        doubleClick={{ disabled: true }}
        centerOnInit={true}
        limitToBounds={false}
        wrapperStyle={{ width: '100%', height: '100%', overflow: 'visible' }}
        contentStyle={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        {({ zoomIn, zoomOut, resetTransform, centerView }) => {
          // Store functions in ref (doesn't cause re-render)
          transformFunctionsRef.current = { zoomIn, zoomOut, resetTransform, centerView };

          return (
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%', overflow: 'visible' }}
              contentStyle={{ width: '100%', height: '100%', overflow: 'visible', minWidth: 'max-content' }}
            >
              <div className="p-8" style={{ minWidth: 'max-content' }}>
                {children}
              </div>
            </TransformComponent>
          );
        }}
      </TransformWrapper>
    </div>
  );
};

export default CanvasView;
