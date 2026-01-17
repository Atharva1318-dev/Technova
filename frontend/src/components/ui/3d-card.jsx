import React, { useRef } from "react";

export const CardContainer = ({ children, className = "" }) => {
    const containerRef = useRef(null);

    const onMouseMove = (e) => {
        const el = containerRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rotateX = ((y - rect.height / 2) / rect.height) * -8;
        const rotateY = ((x - rect.width / 2) / rect.width) * 8;

        el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const onMouseLeave = () => {
        const el = containerRef.current;
        if (!el) return;
        el.style.transform = "rotateX(0deg) rotateY(0deg)";
    };

    return (
        <div
            className={`[perspective:1000px] ${className}`}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
        >
            <div
                ref={containerRef}
                className="transition-transform duration-300 ease-out"
            >
                {children}
            </div>
        </div>
    );
};

export const CardBody = ({ children, className = "" }) => (
    <div
        className={`relative [transform-style:preserve-3d] ${className}`}
    >
        {children}
    </div>
);

export const CardItem = ({ children, translateZ = 0, className = "" }) => (
    <div
        style={{ transform: `translateZ(${translateZ}px)` }}
        className={className}
    >
        {children}
    </div>
);
