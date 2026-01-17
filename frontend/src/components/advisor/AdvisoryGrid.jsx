import { useEffect, useRef } from "react";
import gsap from "gsap";
import AdvisorCard from "./AdvisoryCard";

const AdvisorsGrid = ({ advisors, onFollow, isAdvisorFollowed }) => {
  const gridRef = useRef(null);

  useEffect(() => {
    if (!gridRef.current) return;

    gsap.fromTo(
      gridRef.current.children,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
      }
    );
  }, [advisors]);

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {advisors.map((advisor) => (
        <AdvisorCard
          key={advisor._id}
          advisor={advisor}
          onFollow={onFollow}
          isFollowed={isAdvisorFollowed(advisor._id)}   
        />
      ))}
    </div>
  );
};

export default AdvisorsGrid;
