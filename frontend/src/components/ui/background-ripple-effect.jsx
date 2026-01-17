"use client";
import React, { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const BackgroundRippleEffect = ({
  rows = 8,
  cols = 27,
  cellSize = 56,
}) => {
  const [clickedCell, setClickedCell] = useState(null);
  const [rippleKey, setRippleKey] = useState(0);
  const ref = useRef(null);

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 h-full w-full pointer-events-auto",
        // ✅ Explicit, visible grid color (NOT Tailwind vars)
        "[--cell-border-color:rgba(255,255,255,0.25)]"
      )}
    >
      <DivGrid
        key={rippleKey}
        rows={rows}
        cols={cols}
        cellSize={cellSize}
        borderColor="var(--cell-border-color)"
        clickedCell={clickedCell}
        onCellClick={(row, col) => {
          setClickedCell({ row, col });
          setRippleKey((k) => k + 1);
        }}
        interactive
      />
    </div>
  );
};

const DivGrid = ({
  className,
  rows,
  cols,
  cellSize,
  borderColor,
  clickedCell,
  onCellClick,
  interactive,
}) => {
  const cells = useMemo(
    () => Array.from({ length: rows * cols }, (_, i) => i),
    [rows, cols]
  );

  return (
    <div
      className={cn("absolute inset-0 grid", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
      }}
    >
      {cells.map((idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - row, clickedCell.col - col)
          : 0;

        return (
          <div
            key={idx}
            className={cn(
              "cell border-[0.5px] transition-opacity duration-150",
              "opacity-30 hover:opacity-70",
              clickedCell && "animate-cell-ripple",
              !interactive && "pointer-events-none"
            )}
            style={{
              borderColor,
              backgroundColor: "transparent",
              "--delay": `${distance * 50}ms`,
              "--duration": `${200 + distance * 80}ms`,
            }}
            onClick={
              interactive ? () => onCellClick(row, col) : undefined
            }
          />
        );
      })}
    </div>
  );
};
