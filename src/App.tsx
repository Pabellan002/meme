import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, AppBar, Toolbar, IconButton } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import BrushIcon from '@mui/icons-material/Brush';
import smileEmoji from './assets/smile-emoji.svg';
import './App.css';
// Remove react-resizable
// Example sticker and template imports (add your own as needed)
import coolEmoji from './assets/1.jpg';
import fireEmoji from './assets/2.jpg';
import memeTemplate1 from './assets/3.jpg';
import memeTemplate2 from './assets/4.jpg';
import ShareIcon from '@mui/icons-material/Share';
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import GifIcon from '@mui/icons-material/Gif';
import DeleteIcon from '@mui/icons-material/Delete';

function App() {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [stickers, setStickers] = useState<{
    id: number;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }[]>([]);
  const stickerId = useRef(0);
  const [texts, setTexts] = useState<{
    id: number;
    value: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    color: string;
    fontSize: number;
    fontFamily: string;
    outline: boolean;
    type?: 'top' | 'bottom';
  }[]>([]);
  const textId = useRef(0);
  const [selectedTextId, setSelectedTextId] = useState<number | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<number | null>(null);

  // --- Templates and Stickers ---
  const [customTemplates, setCustomTemplates] = useState<{ src: string; name: string }[]>([]);
  const uploadTemplateInputRef = useRef<HTMLInputElement>(null);
  const templates = [
    { src: memeTemplate1, name: 'Classic 1' },
    { src: memeTemplate2, name: 'Classic 2' },
    // Add more templates here
    ...customTemplates,
  ];
  const stickerPalette = [
    { src: smileEmoji, name: 'Smile' },
    { src: coolEmoji, name: 'Cool' },
    { src: fireEmoji, name: 'Fire' },
    // Add more stickers here
  ];

  // --- Additional Images (not just background) ---
  const [images, setImages] = useState<{
    id: number;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  }[]>([]);
  const imageId = useRef(0);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const addImageInputRef = useRef<HTMLInputElement>(null);
  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages((prev) => [
          ...prev,
          {
            id: imageId.current++,
            src: ev.target?.result as string,
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            rotation: 0,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };
  const removeImage = (id: number) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedImageId === id) setSelectedImageId(null);
  };

  // Drawing state
  const [drawMode, setDrawMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#2563eb');
  const [drawWidth, setDrawWidth] = useState(3);
  const [lines, setLines] = useState<{ points: { x: number; y: number }[]; color: string; width: number }[]>([]);
  const [currentLine, setCurrentLine] = useState<{ points: { x: number; y: number }[]; color: string; width: number } | null>(null);

  // Drawing handlers
  function handleDrawPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!drawMode) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentLine({ points: [{ x, y }], color: drawColor, width: drawWidth });
  }
  function handleDrawPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drawMode || !currentLine) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentLine((prev) => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
  }
  function handleDrawPointerUp() {
    if (!drawMode || !currentLine) return;
    setLines((prev) => [...prev, currentLine]);
    setCurrentLine(null);
  }

  // --- Canvas size state ---
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 520, height: 520 });

  // --- Handle image upload and auto-size canvas ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new window.Image();
        img.onload = () => {
          // Fit to max 90vw/70vh
          const maxW = window.innerWidth * 0.9;
          const maxH = window.innerHeight * 0.7;
          let w = img.width;
          let h = img.height;
          const scale = Math.min(maxW / w, maxH / h, 1);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
          setCanvasSize({ width: w, height: h });
          setBgImage(ev.target?.result as string);
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSticker = (src: string) => {
    setStickers((prev) => {
      const next = [
        ...prev,
        {
          id: stickerId.current++,
          src,
          x: 200,
          y: 200,
          width: 64,
          height: 64,
          rotation: 0,
        },
      ];
      setTimeout(pushHistory, 0);
      return next;
    });
  };

  const updateSticker = (id: number, changes: Partial<typeof stickers[0]>) => {
    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...changes } : s))
    );
  };

  // --- Add Text: focus for editing immediately ---
  const handleAddText = () => {
    setTexts((prev) => {
      const next = [
        ...prev,
        {
          id: textId.current++,
          value: 'Text', // Default value
          x: 120,
          y: 120,
          width: 180,
          height: 48,
          rotation: 0,
          color: '#222',
          fontSize: 32,
          fontFamily: 'Impact, Arial, sans-serif',
          outline: true,
        },
      ];
      return next;
    });
    setTimeout(() => {
      setSelectedTextId(textId.current - 1);
      setSelectedStickerId(null);
      setSelectedImageId(null);
    }, 0);
  };

  const updateText = (id: number, changes: Partial<typeof texts[0]>) => {
    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...changes } : t))
    );
  };

  // Remove text by id
  const removeText = (id: number) => {
    setTexts((prev) => prev.filter((t) => t.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
  };
  // Remove sticker by id
  const removeSticker = (id: number) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  // --- Click outside to exit all edit modes ---
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const canvas = document.getElementById('meme-canvas-glass');
      if (!canvas) return;
      const target = e.target as HTMLElement;
      // If click is on textarea or a text/sticker handle, ignore
      if (target.closest('textarea') || target.closest('.text-handle') || target.closest('.sticker-handle')) return;
      // If click is on a sticker, text, or image box, ignore (handled by their onClick)
      if (target.closest('.meme-text-box') || target.closest('.meme-sticker-box') || target.closest('.meme-image-box')) return;
      // If click is outside the canvas, exit all edit modes
      if (!canvas.contains(target)) {
        setSelectedTextId(null);
        setSelectedStickerId(null);
        setSelectedImageId(null);
      } else {
        // If click is on canvas but not on any element, also exit
        setSelectedTextId(null);
        setSelectedStickerId(null);
        setSelectedImageId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // --- Add Image: Click Outside to Exit ---
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!addImageInputRef.current) return;
      const input = addImageInputRef.current;
      if (input && input.type === 'file' && input.files && input.files.length > 0) return;
      if (document.activeElement === input) return;
      if ((e.target as HTMLElement).closest('#add-image-btn')) return;
      input.value = '';
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const Sticker = ({ sticker }: { sticker: typeof stickers[0] }) => {
    const isSelected = selectedStickerId === sticker.id;
    // Drag/resize/rotate only if selected
    const handleDrag = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!isSelected) return;
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = sticker.x;
      const startTop = sticker.y;
      const onMove = (moveEvent: MouseEvent) => {
        const newX = startLeft + (moveEvent.clientX - startX);
        const newY = startTop + (moveEvent.clientY - startY);
        updateSticker(sticker.id, { x: newX, y: newY });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    const handleResize = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!isSelected) return;
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = sticker.width;
      const startHeight = sticker.height;
      const onMove = (moveEvent: MouseEvent) => {
        const newWidth = Math.max(32, Math.min(200, startWidth + (moveEvent.clientX - startX)));
        const newHeight = Math.max(32, Math.min(200, startHeight + (moveEvent.clientY - startY)));
        updateSticker(sticker.id, { width: newWidth, height: newHeight });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    // --- Improved rotate logic for stickers ---
    const handleRotate = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!isSelected) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
      if (!rect) return;
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const startAngle = sticker.rotation;
      const startX = e.clientX;
      const startY = e.clientY;
      const dx0 = startX - center.x;
      const dy0 = startY - center.y;
      const initialPointerAngle = Math.atan2(dy0, dx0);
      const startAngleRad = startAngle * (Math.PI / 180);
      const onMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - center.x;
        const dy = moveEvent.clientY - center.y;
        const pointerAngle = Math.atan2(dy, dx);
        const delta = pointerAngle - initialPointerAngle;
        const newAngle = (startAngleRad + delta) * (180 / Math.PI);
        updateSticker(sticker.id, { rotation: newAngle });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    return (
      <div
        className="meme-sticker-box"
        style={{
          position: 'absolute',
          left: sticker.x,
          top: sticker.y,
          width: sticker.width,
          height: sticker.height,
          transform: `rotate(${sticker.rotation}deg)` ,
          userSelect: 'none',
          zIndex: isSelected ? 30 : 10,
          outline: isSelected ? '2px solid #2563eb' : 'none',
          borderRadius: 8,
          background: 'transparent',
          boxShadow: isSelected ? '0 0 0 4px #2563eb22' : 'none',
          transition: 'outline 0.15s, box-shadow 0.15s',
        }}
        onMouseDown={e => { e.stopPropagation(); setSelectedStickerId(sticker.id); setSelectedTextId(null); }}
      >
        {/* Remove button for sticker */}
        {isSelected && (
          <button
            onClick={e => { e.stopPropagation(); removeSticker(sticker.id); }}
            style={{
              position: 'absolute',
              top: -16,
              right: -16,
              zIndex: 100,
              background: '#e53935',
              color: '#fff',
              border: '2px solid #fff',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 18,
              boxShadow: '0 2px 8px #e5393544',
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0,
              transition: 'background 0.15s',
            }}
            title="Remove Sticker"
          >
            ×
          </button>
        )}
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            cursor: isSelected ? 'move' : 'pointer',
          }}
          onMouseDown={handleDrag}
        >
            <img
              src={sticker.src}
              alt="sticker"
              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
              draggable={false}
            />
            {/* Rotate handle */}
            {isSelected && (
              <div
                onMouseDown={handleRotate}
                className="sticker-handle"
                style={{
                  position: 'absolute',
                  right: -18,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 18,
                  height: 18,
                  background: '#2563eb',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  boxShadow: '0 2px 8px #2563eb44',
                  zIndex: 20,
                  pointerEvents: 'auto',
                }}
                title="Rotate"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2v4m0 0l2-2m-2 2l-2-2m8.66 3.34A9 9 0 1 1 3 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
           {/* Resize handle (bottom-right corner) */}
            {isSelected && (
             <div
               onMouseDown={handleResize}
               className="sticker-handle"
               style={{
                 position: 'absolute',
                 right: -10,
                 bottom: -10,
                 width: 18,
                 height: 18,
                 background: '#fff',
                 border: '2px solid #2563eb',
                 borderRadius: 4,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 cursor: 'nwse-resize',
                 zIndex: 21,
                 boxShadow: '0 2px 8px #2563eb22',
                 pointerEvents: 'auto',
               }}
               title="Resize"
             >
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="4" y="16" width="16" height="4" rx="1" fill="#2563eb"/><rect x="16" y="4" width="4" height="16" rx="1" fill="#2563eb"/></svg>
             </div>
           )}
        </div>
      </div>
    );
  };

  const TextBox = ({ text }: { text: typeof texts[0] }) => {
    const isSelected = selectedTextId === text.id;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // Native drag logic
    const handleDrag = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = text.x;
      const startTop = text.y;
      const onMove = (moveEvent: MouseEvent) => {
        const newX = startLeft + (moveEvent.clientX - startX);
        const newY = startTop + (moveEvent.clientY - startY);
        updateText(text.id, { x: newX, y: newY });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    // Native resize logic
    const handleResize = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = text.width;
      const startHeight = text.height;
      const onMove = (moveEvent: MouseEvent) => {
        const newWidth = Math.max(60, Math.min(400, startWidth + (moveEvent.clientX - startX)));
        const newHeight = Math.max(32, Math.min(120, startHeight + (moveEvent.clientY - startY)));
        updateText(text.id, { width: newWidth, height: newHeight });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    // --- Improved rotate logic for text ---
    const handleRotate = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
      if (!rect) return;
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const startAngle = text.rotation;
      const startX = e.clientX;
      const startY = e.clientY;
      const dx0 = startX - center.x;
      const dy0 = startY - center.y;
      const initialPointerAngle = Math.atan2(dy0, dx0);
      const startAngleRad = startAngle * (Math.PI / 180);
      const onMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - center.x;
        const dy = moveEvent.clientY - center.y;
        const pointerAngle = Math.atan2(dy, dx);
        const delta = pointerAngle - initialPointerAngle;
        const newAngle = (startAngleRad + delta) * (180 / Math.PI);
        updateText(text.id, { rotation: newAngle });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    // Double-click handler to enter edit mode (focus textarea)
    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      setSelectedTextId(text.id);
      setSelectedStickerId(null);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    };
  return (
      <div
        className="meme-text-box"
        style={{
          position: 'absolute',
          left: text.x,
          top: text.y,
          width: text.width,
          height: text.height,
          transform: `rotate(${text.rotation}deg)` ,
          zIndex: isSelected ? 30 : 20,
          userSelect: 'none',
          outline: isSelected ? '2px solid #2563eb' : 'none',
          borderRadius: 6,
          background: 'transparent',
        }}
        onMouseDown={e => { e.stopPropagation(); setSelectedTextId(text.id); setSelectedStickerId(null); }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Remove button for text */}
        {isSelected && (
          <button
            onClick={e => { e.stopPropagation(); removeText(text.id); }}
            style={{
              position: 'absolute',
              top: -16,
              right: -16,
              zIndex: 100,
              background: '#e53935',
              color: '#fff',
              border: '2px solid #fff',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 18,
              boxShadow: '0 2px 8px #e5393544',
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0,
              transition: 'background 0.15s',
            }}
            title="Remove Text"
          >
            ×
          </button>
        )}
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            cursor: 'move',
          }}
          onMouseDown={handleDrag}
        >
            <textarea
              ref={textareaRef}
              value={text.value}
              onChange={e => updateText(text.id, { value: e.target.value })}
              onBlur={pushHistory}
              style={{
                width: '100%',
                height: '100%',
                fontFamily: text.fontFamily,
                fontSize: text.fontSize,
                color: text.color,
                fontWeight: 900,
                textAlign: 'center',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                textShadow: text.outline ? '2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff' : 'none',
                WebkitTextStroke: text.outline ? '2px #fff' : 'none',
                padding: 0,
                margin: 0,
                overflow: 'hidden',
                cursor: 'move',
                pointerEvents: isSelected ? 'auto' : 'none',
              }}
              spellCheck={false}
            />
            {/* Rotate handle */}
            {isSelected && (
              <div
                onMouseDown={handleRotate}
                className="text-handle"
                style={{
                  position: 'absolute',
                  right: -18,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 18,
                  height: 18,
                  background: '#2563eb',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab',
                  boxShadow: '0 2px 8px #2563eb44',
                  zIndex: 20,
                  pointerEvents: 'auto',
                }}
                title="Rotate"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2v4m0 0l2-2m-2 2l-2-2m8.66 3.34A9 9 0 1 1 3 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
           {/* Resize handle (bottom-right corner) */}
            {isSelected && (
             <div
               onMouseDown={handleResize}
               className="text-handle"
               style={{
                 position: 'absolute',
                 right: -10,
                 bottom: -10,
                 width: 18,
                 height: 18,
                 background: '#fff',
                 border: '2px solid #2563eb',
                 borderRadius: 4,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 cursor: 'nwse-resize',
                 zIndex: 21,
                 boxShadow: '0 2px 8px #2563eb22',
                 pointerEvents: 'auto',
               }}
               title="Resize"
             >
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="4" y="16" width="16" height="4" rx="1" fill="#2563eb"/><rect x="16" y="4" width="4" height="16" rx="1" fill="#2563eb"/></svg>
             </div>
           )}
        </div>
      </div>
    );
  };

  const ImageBox = ({ image }: { image: typeof images[0] }) => {
    const isSelected = selectedImageId === image.id;
    // Drag/resize/rotate only if selected
    const handleDrag = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!isSelected) return;
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = image.x;
      const startTop = image.y;
      const onMove = (moveEvent: MouseEvent) => {
        const newX = startLeft + (moveEvent.clientX - startX);
        const newY = startTop + (moveEvent.clientY - startY);
        setImages((prev) => prev.map(img => img.id === image.id ? { ...img, x: newX, y: newY } : img));
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    const handleResize = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!isSelected) return;
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = image.width;
      const startHeight = image.height;
      const onMove = (moveEvent: MouseEvent) => {
        const newWidth = Math.max(32, Math.min(600, startWidth + (moveEvent.clientX - startX)));
        const newHeight = Math.max(32, Math.min(600, startHeight + (moveEvent.clientY - startY)));
        setImages((prev) => prev.map(img => img.id === image.id ? { ...img, width: newWidth, height: newHeight } : img));
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    const handleRotate = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!isSelected) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
      if (!rect) return;
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const startAngle = image.rotation;
      const startX = e.clientX;
      const startY = e.clientY;
      const dx0 = startX - center.x;
      const dy0 = startY - center.y;
      const initialPointerAngle = Math.atan2(dy0, dx0);
      const startAngleRad = startAngle * (Math.PI / 180);
      const onMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - center.x;
        const dy = moveEvent.clientY - center.y;
        const pointerAngle = Math.atan2(dy, dx);
        const delta = pointerAngle - initialPointerAngle;
        const newAngle = (startAngleRad + delta) * (180 / Math.PI);
        setImages((prev) => prev.map(img => img.id === image.id ? { ...img, rotation: newAngle } : img));
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    return (
      <div
        className="meme-image-box"
        style={{
          position: 'absolute',
          left: image.x,
          top: image.y,
          width: image.width,
          height: image.height,
          transform: `rotate(${image.rotation}deg)` ,
          userSelect: 'none',
          zIndex: isSelected ? 30 : 10,
          outline: isSelected ? '2px solid #2563eb' : 'none',
          borderRadius: 8,
          background: 'transparent',
          boxShadow: isSelected ? '0 0 0 4px #2563eb22' : 'none',
          transition: 'outline 0.15s, box-shadow 0.15s',
        }}
        onMouseDown={e => { e.stopPropagation(); setSelectedImageId(image.id); setSelectedTextId(null); setSelectedStickerId(null); }}
      >
        {/* Remove button for image */}
        {isSelected && (
          <button
            onClick={e => { e.stopPropagation(); removeImage(image.id); }}
            style={{
              position: 'absolute',
              top: -16,
              right: -16,
              zIndex: 100,
              background: '#e53935',
              color: '#fff',
              border: '2px solid #fff',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 18,
              boxShadow: '0 2px 8px #e5393544',
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0,
              transition: 'background 0.15s',
            }}
            title="Remove Image"
          >
            ×
        </button>
        )}
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            cursor: isSelected ? 'move' : 'pointer',
          }}
          onMouseDown={handleDrag}
        >
        <img
          src={image.src}
          alt="uploaded"
          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
          draggable={false}
        />
        {/* Rotate handle */}
        {isSelected && (
          <div
            onMouseDown={handleRotate}
            className="image-handle"
            style={{
              position: 'absolute',
              right: -18,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 18,
              height: 18,
              background: '#2563eb',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              boxShadow: '0 2px 8px #2563eb44',
              zIndex: 20,
              pointerEvents: 'auto',
            }}
            title="Rotate"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2v4m0 0l2-2m-2 2l-2-2m8.66 3.34A9 9 0 1 1 3 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        )}
        {/* Resize handle (bottom-right corner) */}
        {isSelected && (
          <div
            onMouseDown={handleResize}
            className="image-handle"
            style={{
              position: 'absolute',
              right: -10,
              bottom: -10,
              width: 18,
              height: 18,
              background: '#fff',
              border: '2px solid #2563eb',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'nwse-resize',
              zIndex: 21,
              boxShadow: '0 2px 8px #2563eb22',
              pointerEvents: 'auto',
            }}
            title="Resize"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="4" y="16" width="16" height="4" rx="1" fill="#2563eb"/><rect x="16" y="4" width="4" height="16" rx="1" fill="#2563eb"/></svg>
          </div>
        )}
      </div>
    </div>
  );
};

  // --- Stickers: allow upload ---
  const [customStickers, setCustomStickers] = useState<{ src: string; name: string }[]>([]);
  const uploadStickerInputRef = useRef<HTMLInputElement>(null);
  const handleUploadSticker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomStickers((prev) => [
          ...prev,
          { src: ev.target?.result as string, name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Top/Bottom Meme Text State ---
  // Add top and bottom text as part of texts array if not present
  useEffect(() => {
    setTexts(prev => {
      let next = [...prev];
      if (!next.some(t => t.type === 'top')) {
        next = [
          {
            id: textId.current++,
            value: 'TOP TEXT',
            x: 60,
            y: 12,
            width: 400,
            height: 48,
            rotation: 0,
            color: '#000',
            fontSize: 40,
            fontFamily: 'Impact, Arial, sans-serif',
            outline: true,
            type: 'top',
          },
          ...next
        ];
      }
      if (!next.some(t => t.type === 'bottom')) {
        next = [
          ...next,
          {
            id: textId.current++,
            value: 'BOTTOM TEXT',
            x: 60,
            y: 420,
            width: 400,
            height: 48,
            rotation: 0,
            color: '#000',
            fontSize: 40,
            fontFamily: 'Impact, Arial, sans-serif',
            outline: true,
            type: 'bottom',
          }
        ];
      }
      return next;
    });
    // eslint-disable-next-line
  }, []);

  // --- Image Effects State ---
  const [imageEffects, setImageEffects] = useState({
    opacity: 1,
    brightness: 1,
    contrast: 1,
    blur: 0,
    saturate: 1,
    hue: 0,
    grayscale: false,
    sepia: false,
    invert: false,
    shadow: false,
    vignette: false,
  });

  // --- Image Effects Style ---
  const getImageFilter = () => {
    let filter = `opacity(${imageEffects.opacity}) brightness(${imageEffects.brightness}) contrast(${imageEffects.contrast}) blur(${imageEffects.blur}px) saturate(${imageEffects.saturate}) hue-rotate(${imageEffects.hue}deg)`;
    if (imageEffects.grayscale) filter += ' grayscale(1)';
    if (imageEffects.sepia) filter += ' sepia(1)';
    if (imageEffects.invert) filter += ' invert(1)';
    return filter;
  };

  // --- Central History Stack for Undo/Redo ---
  type MemeState = {
    bgImage: string | null;
    stickers: typeof stickers;
    texts: typeof texts;
    images: typeof images;
    lines: typeof lines;
    imageEffects: typeof imageEffects;
  };
  const [history, setHistory] = useState<MemeState[]>([]);
  const [future, setFuture] = useState<MemeState[]>([]);

  // Helper to snapshot current state
  const snapshot = () => ({
    bgImage,
    stickers,
    texts,
    images,
    lines,
    imageEffects,
  });

  // Call this after every major action
  const pushHistory = () => {
    setHistory((prev) => [...prev, snapshot()]);
    setFuture([]);
  };

  // Undo/Redo handlers
  const handleUndo = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setFuture((f) => [snapshot(), ...f]);
      setBgImage(last.bgImage);
      setStickers(last.stickers);
      setTexts(last.texts);
      setImages(last.images);
      setLines(last.lines);
      setImageEffects(last.imageEffects);
      return prev.slice(0, -1);
    });
  };
  const handleRedo = () => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setHistory((prev) => [...prev, snapshot()]);
      setBgImage(next.bgImage);
      setStickers(next.stickers);
      setTexts(next.texts);
      setImages(next.images);
      setLines(next.lines);
      setImageEffects(next.imageEffects);
      return f.slice(1);
    });
  };

  // --- New Meme Handler ---
  const handleNew = () => {
    setBgImage(null);
    setStickers([]);
    setTexts([
      {
        id: textId.current++,
        value: 'TOP TEXT',
        x: 60,
        y: 12,
        width: 400,
        height: 48,
        rotation: 0,
        color: '#000',
        fontSize: 40,
        fontFamily: 'Impact, Arial, sans-serif',
        outline: true,
        type: 'top',
      },
      {
        id: textId.current++,
        value: 'BOTTOM TEXT',
        x: 60,
        y: 420,
        width: 400,
        height: 48,
        rotation: 0,
        color: '#000',
        fontSize: 40,
        fontFamily: 'Impact, Arial, sans-serif',
        outline: true,
        type: 'bottom',
      },
    ]);
    setImages([]);
    setLines([]);
    setImageEffects({
      opacity: 1,
      brightness: 1,
      contrast: 1,
      blur: 0,
      saturate: 1,
      hue: 0,
      grayscale: false,
      sepia: false,
      invert: false,
      shadow: false,
      vignette: false,
    });
    setHistory([]);
    setFuture([]);
  };

  // --- Export/Download/Share Logic ---
  const [exportType, setExportType] = useState<'PNG' | 'JPG' | 'GIF'>('PNG');
  const [isExporting, setIsExporting] = useState(false);

  // Helper to render meme to canvas and return data URL
  const renderMemeToCanvas = async (type: 'PNG' | 'JPG' | 'GIF' = 'PNG'): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    // Draw background
    if (bgImage) {
      const img = new window.Image();
      img.src = bgImage;
      await new Promise(res => { img.onload = res; });
      ctx.save();
      // Apply image effects
      ctx.globalAlpha = imageEffects.opacity;
      ctx.filter =
        `brightness(${imageEffects.brightness}) ` +
        `contrast(${imageEffects.contrast}) ` +
        `blur(${imageEffects.blur}px) ` +
        `saturate(${imageEffects.saturate}) ` +
        `hue-rotate(${imageEffects.hue}deg)` +
        (imageEffects.grayscale ? ' grayscale(1)' : '') +
        (imageEffects.sepia ? ' sepia(1)' : '') +
        (imageEffects.invert ? ' invert(1)' : '');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      // Shadow
      if (imageEffects.shadow) {
        ctx.save();
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 32;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      // Vignette
      if (imageEffects.vignette) {
        const grad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.6,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 1.1
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Draw images
    for (const image of images) {
      const img = new window.Image();
      img.src = image.src;
      await new Promise(res => { img.onload = res; });
      ctx.save();
      ctx.translate(image.x + image.width / 2, image.y + image.height / 2);
      ctx.rotate((image.rotation * Math.PI) / 180);
      ctx.drawImage(img, -image.width / 2, -image.height / 2, image.width, image.height);
      ctx.restore();
    }
    // Draw stickers
    for (const sticker of stickers) {
      const img = new window.Image();
      img.src = sticker.src;
      await new Promise(res => { img.onload = res; });
      ctx.save();
      ctx.translate(sticker.x + sticker.width / 2, sticker.y + sticker.height / 2);
      ctx.rotate((sticker.rotation * Math.PI) / 180);
      ctx.drawImage(img, -sticker.width / 2, -sticker.height / 2, sticker.width, sticker.height);
      ctx.restore();
    }
    // Draw lines (drawings)
    for (const line of lines) {
      ctx.save();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      line.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.restore();
    }
    // Draw custom texts
    for (const text of texts) {
      ctx.save();
      ctx.translate(text.x + text.width / 2, text.y + text.height / 2);
      ctx.rotate((text.rotation * Math.PI) / 180);
      ctx.font = `900 ${text.fontSize}px ${text.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = text.color;
      ctx.strokeStyle = text.outline
        ? (text.color.toLowerCase() === '#000' || text.color.toLowerCase() === 'black' ? '#fff' : '#000')
        : 'transparent';
      ctx.lineWidth = text.outline ? 6 : 0;
      ctx.shadowColor = text.outline ? '#000' : 'transparent';
      ctx.shadowBlur = text.outline ? 6 : 0;
      ctx.strokeText(text.value, 0, 0);
      ctx.shadowBlur = 0;
      ctx.fillText(text.value, 0, 0);
      ctx.restore();
    }
    // Return data URL
    if (type === 'JPG') return canvas.toDataURL('image/jpeg', 0.95);
    if (type === 'GIF') {
      // For static GIF, use toDataURL and convert to GIF (not animated)
      // Use a library for real GIFs; here we just convert PNG to GIF
      // This is a placeholder: browsers don't natively support canvas to GIF
      // We'll use PNG and change the MIME type for now
      return canvas.toDataURL('image/png').replace('image/png', 'image/gif');
    }
    return canvas.toDataURL('image/png');
  };

  // Download handler
  const handleDownload = async () => {
    setIsExporting(true);
    const url = await renderMemeToCanvas(exportType);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meme.${exportType.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setIsExporting(false);
  };

  // Share handler
  const handleShare = async () => {
    setIsExporting(true);
    const url = await renderMemeToCanvas(exportType);
    if (typeof navigator.share === 'function' && navigator.canShare && navigator.canShare({ files: [new File([], '')] })) {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], `meme.${exportType.toLowerCase()}`, { type: blob.type });
      try {
        await navigator.share({ files: [file], title: 'My Meme', text: 'Check out my meme!' });
      } catch (e) {
        ('Share cancelled or failed.');
      }
    } else {
      ('Sharing is not supported on this device. Download instead.');
    }
    setIsExporting(false);
  };

  // Export as GIF handler (same as download but always GIF)
  const handleExportGif = async () => {
    setIsExporting(true);
    const url = await renderMemeToCanvas('GIF');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meme.gif';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setIsExporting(false);
  };

  // 2. Add Share Modal and Toast
  const [shareOpen, setShareOpen] = useState(false);

  const handleShareModal = () => setShareOpen(true);
  const handleCloseShare = () => setShareOpen(false);
  const handleCopyToClipboard = async () => {
    setIsExporting(true);
    const url = await renderMemeToCanvas(exportType);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      if (window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ [blob.type]: blob })
        ]);
        ('Copied to clipboard!');
        setShareOpen(false);
      } else {
        ('Copy to clipboard is not supported in this browser.');
      }
    } catch {
      ('Copy failed.');
    }
    setIsExporting(false);
  };

  const handleUploadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomTemplates((prev) => [
          ...prev,
          { src: ev.target?.result as string, name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ height: '100vh', width: '100vw', background: '#181a20' }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(90deg,#23272f 60%,#181a20 100%)', boxShadow: '0 2px 24px #00ffe744', height: 56, justifyContent: 'center' }}>
        <Toolbar sx={{ minHeight: 56, display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', marginRight: 12 }}>
            <img src={smileEmoji} alt="logo" style={{ width: 32, height: 32, marginRight: 8 }} />
          </span>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 900, color: '#fff', fontSize: '2rem', letterSpacing: 1, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', textShadow: '0 2px 12px #00ffe7aa' }}>
            Meme Maker
          </Typography>
          <Button variant="contained" startIcon={<GifIcon />} onClick={handleExportGif} sx={{ borderRadius: 2, fontWeight: 700, fontSize: '1.1rem', px: 2, py: 1, mr: 1, background: 'linear-gradient(90deg,#ff00c8 0%,#00bfff 100%)', color: '#fff', textTransform: 'uppercase', fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif' }}>Export as GIF</Button>
          <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={handleNew} sx={{ borderRadius: 2, fontWeight: 700, fontSize: '1.1rem', px: 2, py: 1, mr: 1, color: '#fff', borderColor: '#00ffe7', textTransform: 'uppercase', fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif' }}>New</Button>
          <Button variant="outlined" startIcon={<UndoIcon />} onClick={handleUndo} sx={{ borderRadius: 2, fontWeight: 700, fontSize: '1.1rem', px: 2, py: 1, mr: 1, color: '#fff', borderColor: '#00ffe7', textTransform: 'uppercase', fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif' }} disabled={history.length === 0}>Undo</Button>
          <Button variant="outlined" startIcon={<RedoIcon />} onClick={handleRedo} sx={{ borderRadius: 2, fontWeight: 700, fontSize: '1.1rem', px: 2, py: 1, mr: 1, color: '#fff', borderColor: '#00ffe7', textTransform: 'uppercase', fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif' }} disabled={future.length === 0}>Redo</Button>
          <select style={{ marginRight: 12, borderRadius: 6, border: '1.5px solid #00ffe7', padding: '4px 8px', background: '#181a20', color: '#fff', fontWeight: 700, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 16 }} value={exportType} onChange={e => setExportType(e.target.value as 'PNG' | 'JPG' | 'GIF')}>
            <option value="PNG">PNG</option>
            <option value="JPG">JPG</option>
            <option value="GIF">GIF</option>
          </select>
          <Button variant="contained" onClick={handleDownload} sx={{ borderRadius: 2, fontWeight: 700, fontSize: '1.1rem', px: 3, py: 1, boxShadow: '0 2px 12px #00ffe744', background: 'linear-gradient(90deg,#00ffe7 0%,#00bfff 100%)', color: '#181a20', textTransform: 'uppercase', fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', mr: 1 }}>{isExporting ? 'Exporting...' : 'Download'}</Button>
          <Button variant="contained" startIcon={<ShareIcon />} onClick={handleShareModal} sx={{ borderRadius: 2, fontWeight: 700, fontSize: '1.1rem', px: 2, py: 1, background: 'linear-gradient(90deg,#00ffe7 0%,#ff00c8 100%)', color: '#181a20', textTransform: 'uppercase', fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif' }}>Share</Button>
        </Toolbar>
      </AppBar>
      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
        {/* Sidebar */}
        <aside style={{ width: 280, background: 'linear-gradient(180deg,#23272f 60%,#181a20 100%)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '24px 0 0 0', boxShadow: '4px 0 24px #00ffe722', zIndex: 10 }}>
          <div style={{ padding: '0 24px', marginBottom: 24 }}>
            <Button fullWidth variant="contained" startIcon={<AddPhotoAlternateIcon />} onClick={() => document.getElementById('main-upload-input')?.click()} sx={{ mb: 2, bgcolor: '#00ffe7', color: '#181a20', fontWeight: 900, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18, borderRadius: 3, boxShadow: '0 2px 12px #00ffe744', textTransform: 'uppercase' }}>Upload Image</Button>
            <input id="main-upload-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            <Button fullWidth variant="contained" startIcon={<AddPhotoAlternateIcon />} id="add-image-btn" onClick={() => addImageInputRef.current?.click()} sx={{ mb: 2, bgcolor: '#00bfff', color: '#181a20', fontWeight: 900, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18, borderRadius: 3, boxShadow: '0 2px 12px #00bfff44', textTransform: 'uppercase' }}>Add Image</Button>
            <input ref={addImageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAddImage} />
            <div style={{ margin: '16px 0 0 0' }}>
              {/* Top Text Controls */}
              <label style={{ color: '#00ffe7', fontWeight: 700, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18 }}>Top Text</label>
              <input type="text" value={texts.find(t => t.type === 'top')?.value || ''} onChange={e => setTexts(texts => texts.map(t => t.type === 'top' ? { ...t, value: e.target.value } : t))} style={{ width: '100%', borderRadius: 6, border: '1.5px solid #00ffe7', padding: '4px 8px', marginBottom: 8, background: '#181a20', color: '#fff', fontWeight: 900, fontSize: 18, fontFamily: texts.find(t => t.type === 'top')?.fontFamily || 'Impact, Arial, sans-serif' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input type="color" value={texts.find(t => t.type === 'top')?.color || '#fff'} onChange={e => setTexts(texts => texts.map(t => t.type === 'top' ? { ...t, color: e.target.value } : t))} title="Text Color" style={{ width: 32, height: 32, border: 'none', borderRadius: 0, background: 'none', cursor: 'pointer', padding: 0, display: 'inline-block' }} />
                <select value={texts.find(t => t.type === 'top')?.fontFamily || 'Impact, Arial, sans-serif'} onChange={e => setTexts(texts => texts.map(t => t.type === 'top' ? { ...t, fontFamily: e.target.value } : t))} style={{ borderRadius: 6, border: '1.5px solid #00ffe7', padding: '4px 8px', background: '#181a20', color: '#fff', fontWeight: 700, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 16 }}>
                  <option value="Impact, Arial, sans-serif">Impact</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Comic Sans MS, Comic Sans, cursive">Comic Sans</option>
                  <option value="Times New Roman, Times, serif">Times New Roman</option>
                  <option value="Courier New, Courier, monospace">Courier New</option>
                </select>
                <input type="range" min={16} max={72} value={texts.find(t => t.type === 'top')?.fontSize || 40} onChange={e => setTexts(texts => texts.map(t => t.type === 'top' ? { ...t, fontSize: Number(e.target.value) } : t))} style={{ width: 60 }} title="Font Size" />
                <span style={{ color: '#fff', fontWeight: 700 }}>{texts.find(t => t.type === 'top')?.fontSize || 40}px</span>
              </div>
              {/* Bottom Text Controls */}
              <label style={{ color: '#00ffe7', fontWeight: 700, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18 }}>Bottom Text</label>
              <input type="text" value={texts.find(t => t.type === 'bottom')?.value || ''} onChange={e => setTexts(texts => texts.map(t => t.type === 'bottom' ? { ...t, value: e.target.value } : t))} style={{ width: '100%', borderRadius: 6, border: '1.5px solid #00ffe7', padding: '4px 8px', marginBottom: 8, background: '#181a20', color: '#fff', fontWeight: 900, fontSize: 18, fontFamily: texts.find(t => t.type === 'bottom')?.fontFamily || 'Impact, Arial, sans-serif' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input type="color" value={texts.find(t => t.type === 'bottom')?.color || '#fff'} onChange={e => setTexts(texts => texts.map(t => t.type === 'bottom' ? { ...t, color: e.target.value } : t))} title="Text Color" style={{ width: 32, height: 32, border: 'none', borderRadius: 0, background: 'none', cursor: 'pointer', padding: 0, display: 'inline-block' }} />
                <select value={texts.find(t => t.type === 'bottom')?.fontFamily || 'Impact, Arial, sans-serif'} onChange={e => setTexts(texts => texts.map(t => t.type === 'bottom' ? { ...t, fontFamily: e.target.value } : t))} style={{ borderRadius: 6, border: '1.5px solid #00ffe7', padding: '4px 8px', background: '#181a20', color: '#fff', fontWeight: 700, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 16 }}>
                  <option value="Impact, Arial, sans-serif">Impact</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Comic Sans MS, Comic Sans, cursive">Comic Sans</option>
                  <option value="Times New Roman, Times, serif">Times New Roman</option>
                  <option value="Courier New, Courier, monospace">Courier New</option>
                </select>
                <input type="range" min={16} max={72} value={texts.find(t => t.type === 'bottom')?.fontSize || 40} onChange={e => setTexts(texts => texts.map(t => t.type === 'bottom' ? { ...t, fontSize: Number(e.target.value) } : t))} style={{ width: 60 }} title="Font Size" />
                <span style={{ color: '#fff', fontWeight: 700 }}>{texts.find(t => t.type === 'bottom')?.fontSize || 40}px</span>
              </div>
            </div>
            <div style={{ background: '#181a20', borderRadius: 12, boxShadow: '0 2px 12px #00ffe744', padding: '16px 12px', margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button fullWidth variant="contained" startIcon={<TextFieldsIcon />} onClick={handleAddText} sx={{ mb: 0, bgcolor: '#00bfff', color: '#181a20', fontWeight: 900, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18, borderRadius: 3, boxShadow: '0 2px 12px #00bfff44', textTransform: 'uppercase' }}>Add Text</Button>
              {/* Edit Text */}
              {selectedTextId !== null && (() => {
                const text = texts.find(t => t.id === selectedTextId);
                if (!text) return null;
                return (
                  <div 
                    style={{ background: '#23272f', borderRadius: 10, boxShadow: '0 2px 12px #00ffe744', padding: '12px 8px', minWidth: 180, display: 'flex', flexDirection: 'column', gap: 8 }}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={text.value}
                      onChange={e => updateText(text.id, { value: e.target.value })}
                      onBlur={pushHistory}
                      style={{ fontSize: 16, fontFamily: text.fontFamily, color: '#fff', fontWeight: 900, border: '1.5px solid #00ffe7', borderRadius: 6, padding: '2px 8px', minWidth: 80, width: '100%', background: '#181a20', colorScheme: 'dark', marginBottom: 4, height: 28, boxSizing: 'border-box', overflow: 'hidden' }}
                      placeholder="Edit text..."
                      autoFocus
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="color"
                        value={text.color}
                        onChange={e => updateText(text.id, { color: e.target.value })}
                        style={{ width: 28, height: 28, border: 'none', borderRadius: 0, background: 'none', cursor: 'pointer', padding: 0, display: 'inline-block' }}
                        title="Text Color"
                      />
                      <select
                        value={text.fontFamily}
                        onChange={e => updateText(text.id, { fontFamily: e.target.value })}
                        style={{ borderRadius: 6, border: '1.5px solid #00ffe7', padding: '2px 6px', background: '#181a20', color: '#fff', fontWeight: 700, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 14 }}
                      >
                        <option value="Impact, Arial, sans-serif">Impact</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Comic Sans MS, Comic Sans, cursive">Comic Sans</option>
                        <option value="Times New Roman, Times, serif">Times New Roman</option>
                        <option value="Courier New, Courier, monospace">Courier New</option>
                      </select>
                      <input
                        type="range"
                        min={16}
                        max={72}
                        value={text.fontSize}
                        onChange={e => updateText(text.id, { fontSize: Number(e.target.value) })}
                        style={{ width: 50 }}
                        title="Font Size"
                      />
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{text.fontSize}px</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#fff', fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={text.outline}
                          onChange={e => updateText(text.id, { outline: e.target.checked })}
                        />
                        Outline
                      </label>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          {/* --- Redesigned Text Boxes Card --- */}
          <div style={{ padding: '0 24px', marginBottom: 24 }}>
            <div style={{ background: 'rgba(24,26,32,0.85)', borderRadius: 16, boxShadow: '0 4px 24px #00ffe744', border: '1.5px solid #00ffe7', padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Typography variant="subtitle2" sx={{ color: '#00ffe7', fontWeight: 900, mb: 1, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 20, textAlign: 'center', width: '100%', letterSpacing: 1 }}>Text Boxes</Typography>
              <div style={{ flex: 1, minHeight: 80, maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '0 2px' }}>
                {texts.map((text) => (
                  <div key={text.id} style={{ display: 'flex', alignItems: 'center', background: selectedTextId === text.id ? 'rgba(0,255,231,0.10)' : 'rgba(35,39,47,0.85)', borderRadius: 8, boxShadow: selectedTextId === text.id ? '0 2px 8px #00ffe744' : 'none', border: selectedTextId === text.id ? '1.5px solid #00ffe7' : '1.5px solid transparent', padding: '4px 8px', transition: 'all 0.15s', cursor: 'pointer', minHeight: 36 }}>
                    <span onClick={() => setSelectedTextId(text.id)} style={{ flex: 1, fontSize: 15, fontWeight: 900, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', color: selectedTextId === text.id ? '#00ffe7' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{text.value || 'Text'}</span>
                    <IconButton size="small" onClick={() => removeText(text.id)} title="Remove" sx={{ color: '#e53935', width: 28, height: 28, borderRadius: 2, p: 0.5, ml: 1, transition: 'background 0.15s', '&:hover': { background: '#e5393533' } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* End Text Boxes Card */}
          <div style={{ padding: '0 24px', marginBottom: 24 }}>
            {/* Remove Templates and Stickers sections from left sidebar */}
          </div>
        </aside>
        {/* Main Meme Canvas Area */}
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 60% 40%, #23272f 60%, #181a20 100%)', position: 'relative', minHeight: 'calc(100vh - 56px)' }}>
          <div
            className="meme-canvas-glass"
            id="meme-canvas-glass"
            style={{
              position: 'relative',
              width: canvasSize.width,
              height: canvasSize.height,
              maxWidth: '90vw',
              maxHeight: '70vh',
              margin: '32px 0 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              borderRadius: 24,
              boxShadow: '0 8px 40px 0 #00ffe744',
              border: '2.5px solid #00ffe7',
              overflow: 'hidden',
            }}
          >
            {bgImage && (
              <img
                src={bgImage}
                alt="Meme Background"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  filter: getImageFilter(),
                  boxShadow: imageEffects.shadow ? '0 0 32px 8px #000a' : undefined,
                  pointerEvents: 'none',
                }}
              />
            )}
           {/* Vignette effect overlay */}
           {bgImage && imageEffects.vignette && (
             <div style={{
               position: 'absolute',
               top: 0,
               left: 0,
               width: '100%',
               height: '100%',
               pointerEvents: 'none',
               borderRadius: 24,
               background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)',
               zIndex: 2,
             }} />
           )}
            {/* Draw overlay for pointer events */}
            {drawMode && (
              <div
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, cursor: 'crosshair', background: 'transparent' }}
                onPointerDown={handleDrawPointerDown}
                onPointerMove={handleDrawPointerMove}
                onPointerUp={handleDrawPointerUp}
                onPointerLeave={handleDrawPointerUp}
              />
            )}
            {/* Drawn lines as SVG */}
            <svg
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 21 }}
              width="100%" height="100%"
            >
              {lines.map((line, i) => (
                <polyline
                  key={i}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={line.width}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={line.points.map(p => `${p.x},${p.y}`).join(' ')}
                />
              ))}
              {currentLine && (
                <polyline
                  fill="none"
                  stroke={currentLine.color}
                  strokeWidth={currentLine.width}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={currentLine.points.map(p => `${p.x},${p.y}`).join(' ')}
                />
              )}
            </svg>
            {/* Render all texts (top, bottom, custom) as TextBox */}
            {texts.map((text) => (
              <TextBox key={text.id} text={text} />
            ))}
            {images.map((image) => (
              <ImageBox key={image.id} image={image} />
            ))}
            {stickers.map((sticker) => (
              <Sticker key={sticker.id} sticker={sticker} />
            ))}
          </div>
        </main>
        {/* Right Sidebar: Image Effects */}
        <aside style={{ width: 320, background: 'linear-gradient(180deg,#23272f 60%,#181a20 100%)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '24px 0 0 0', boxShadow: '-4px 0 24px #00ffe722', zIndex: 10 }}>
          <div style={{ padding: '0 24px', marginBottom: 24 }}>
            <Typography variant="subtitle2" sx={{ color: '#00ffe7', fontWeight: 700, mb: 1, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18 }}>Image Effects</Typography>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label>Opacity <input type="range" min={0} max={1} step={0.01} value={imageEffects.opacity} onChange={e => setImageEffects(effects => ({ ...effects, opacity: Number(e.target.value) }))} style={{ width: '100%' }} /></label>
              <label>Brightness <input type="range" min={0.5} max={2} step={0.01} value={imageEffects.brightness} onChange={e => setImageEffects(effects => ({ ...effects, brightness: Number(e.target.value) }))} style={{ width: '100%' }} /></label>
              <label>Contrast <input type="range" min={0.5} max={2} step={0.01} value={imageEffects.contrast} onChange={e => setImageEffects(effects => ({ ...effects, contrast: Number(e.target.value) }))} style={{ width: '100%' }} /></label>
              <label>Blur <input type="range" min={0} max={10} step={0.1} value={imageEffects.blur} onChange={e => setImageEffects(effects => ({ ...effects, blur: Number(e.target.value) }))} style={{ width: '100%' }} /></label>
              <label>Saturate <input type="range" min={0} max={3} step={0.01} value={imageEffects.saturate} onChange={e => setImageEffects(effects => ({ ...effects, saturate: Number(e.target.value) }))} style={{ width: '100%' }} /></label>
              <label>Hue <input type="range" min={-180} max={180} step={1} value={imageEffects.hue} onChange={e => setImageEffects(effects => ({ ...effects, hue: Number(e.target.value) }))} style={{ width: '100%' }} /></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                <label><input type="checkbox" checked={imageEffects.grayscale} onChange={e => setImageEffects(effects => ({ ...effects, grayscale: e.target.checked }))} /> Grayscale</label>
                <label><input type="checkbox" checked={imageEffects.sepia} onChange={e => setImageEffects(effects => ({ ...effects, sepia: e.target.checked }))} /> Sepia</label>
                <label><input type="checkbox" checked={imageEffects.invert} onChange={e => setImageEffects(effects => ({ ...effects, invert: e.target.checked }))} /> Invert</label>
                <label><input type="checkbox" checked={imageEffects.shadow} onChange={e => setImageEffects(effects => ({ ...effects, shadow: e.target.checked }))} /> Shadow</label>
                <label><input type="checkbox" checked={imageEffects.vignette} onChange={e => setImageEffects(effects => ({ ...effects, vignette: e.target.checked }))} /> Vignette</label>
              </div>
            </div>
          </div>
          <div style={{ padding: '0 24px', marginBottom: 24 }}>
            <Button fullWidth variant="contained" startIcon={<BrushIcon />} onClick={() => setDrawMode((d) => !d)} sx={{ bgcolor: drawMode ? '#ff00c8' : '#23272f', color: drawMode ? '#fff' : '#00ffe7', fontWeight: 900, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18, borderRadius: 3, boxShadow: drawMode ? '0 2px 12px #ff00c844' : '0 2px 12px #00ffe744', textTransform: 'uppercase', mb: 2 }}>{drawMode ? 'Drawing...' : 'Draw'}</Button>
            {drawMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <label style={{ color: '#00ffe7', fontWeight: 700, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 16 }}>Color</label>
                <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)} style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer' }} />
                <label style={{ color: '#00ffe7', fontWeight: 700, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 16 }}>Size</label>
                <input type="range" min={1} max={20} value={drawWidth} onChange={e => setDrawWidth(Number(e.target.value))} style={{ width: 80 }} />
                <span style={{ color: '#fff', fontWeight: 700 }}>{drawWidth}px</span>
              </div>
            )}
          </div>
          <div style={{ padding: '0 24px', marginBottom: 24 }}>
            <Typography variant="subtitle2" sx={{ color: '#00ffe7', fontWeight: 700, mb: 1, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18 }}>Templates</Typography>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12 }}>
              {templates.map((tpl) => (
                <img key={tpl.src} src={tpl.src} alt={tpl.name} title={tpl.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '2px solid #00ffe7', cursor: 'pointer', boxShadow: '0 2px 8px #00ffe744', margin: '0 2px' }} onClick={() => setBgImage(tpl.src)} />
              ))}
              <IconButton color="primary" onClick={() => uploadTemplateInputRef.current?.click()} title="Upload Template" style={{ background: '#23272f', borderRadius: 8, width: 48, height: 48, margin: 0, border: '2px solid #ff00c8', flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <AddPhotoAlternateIcon sx={{ color: '#ff00c8' }} />
                <input ref={uploadTemplateInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadTemplate} />
              </IconButton>
            </div>
            <Typography variant="subtitle2" sx={{ color: '#00ffe7', fontWeight: 700, mb: 1, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18 }}>Stickers</Typography>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 4, scrollbarWidth: 'thin' }}>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 4, scrollbarWidth: 'thin' }}>
                {[...stickerPalette, ...customStickers].map((stk, i) => (
                  <IconButton key={stk.src + i} color="primary" onClick={() => handleAddSticker(stk.src)} title={stk.name} style={{ background: '#23272f', borderRadius: 8, width: 48, height: 48, margin: 0, border: '2px solid #00ffe7', flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={stk.src} alt={stk.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                  </IconButton>
                ))}
                <IconButton color="primary" onClick={() => uploadStickerInputRef.current?.click()} title="Upload Sticker" style={{ background: '#23272f', borderRadius: 8, width: 48, height: 48, margin: 0, border: '2px solid #ff00c8', flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <EmojiEmotionsIcon sx={{ color: '#ff00c8' }} />
                  <input ref={uploadStickerInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadSticker} />
                </IconButton>
              </div>
            </div>
          </div>
        </aside>
      </div>
      {/* Share Modal */}
      {shareOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }} onClick={handleCloseShare}>
          <div style={{ background: '#23272f', borderRadius: 16, boxShadow: '0 2px 24px #00ffe744', padding: 32, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 18 }} onClick={e => e.stopPropagation()}>
            <Typography variant="h6" sx={{ color: '#00ffe7', fontWeight: 900, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 24, textAlign: 'center', mb: 2 }}>Share Meme</Typography>
            <Button fullWidth variant="contained" onClick={handleDownload} sx={{ bgcolor: '#00ffe7', color: '#181a20', fontWeight: 900, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18, borderRadius: 3, boxShadow: '0 2px 12px #00ffe744', textTransform: 'uppercase' }}>Download</Button>
            <Button fullWidth variant="contained" onClick={handleCopyToClipboard} sx={{ bgcolor: '#ff00c8', color: '#fff', fontWeight: 900, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18, borderRadius: 3, boxShadow: '0 2px 12px #ff00c844', textTransform: 'uppercase' }}>Copy to Clipboard</Button>
            {typeof navigator.share === 'function' && (
              <Button fullWidth variant="contained" onClick={handleShare} sx={{ bgcolor: '#00bfff', color: '#181a20', fontWeight: 900, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18, borderRadius: 3, boxShadow: '0 2px 12px #00bfff44', textTransform: 'uppercase' }}>Share via Device</Button>
            )}
            <Button fullWidth variant="outlined" onClick={handleCloseShare} sx={{ color: '#fff', borderColor: '#00ffe7', fontWeight: 900, fontFamily: 'Bangers, Impact, Inter, Arial, sans-serif', fontSize: 18, borderRadius: 3, textTransform: 'uppercase', mt: 1 }}>Close</Button>
          </div>
        </div>
      )}
    </Box>
  );
}

export default App;
