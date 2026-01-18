import React from "react";
import { CardContainer, CardBody, CardItem } from "../../components/ui/3d-card";
import { Award, ShieldCheck, Check } from "lucide-react";

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/initials/svg?seed=Advisor";

const AdvisorCard = ({ advisor, onFollow, isFollowed }) => {
    return (
        <CardContainer className="w-full inter-var">
            {/* UPDATED THEME:
        1. bg-white -> bg-neutral-900/50 (Dark Glass)
        2. border-gray-200 -> border-white/10 (Subtle Border)
      */}
            <CardBody className="bg-neutral-200/50 relative group/card border-white/10 w-full h-auto rounded-3xl p-6 border backdrop-blur-xl transition-all duration-300">

                {/* Profile Image */}
                <CardItem translateZ="50" className="w-full flex justify-center mt-2">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full"></div>
                        <img
                            src={advisor.profilePicture || DEFAULT_AVATAR}
                            alt={advisor.name}
                            className="h-24 w-24 rounded-full object-cover border-2 border-white/10 relative z-10"
                        />
                        {/* Verified Badge */}
                        <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-neutral-900 z-20">
                            <ShieldCheck className="w-3 h-3" />
                        </div>
                    </div>
                </CardItem>

                {/* Name & Title */}
                <CardItem
                    as="p"
                    translateZ="60"
                    className="text-black text-xl font-bold text-center w-full mt-4"
                >
                    {advisor.name}
                </CardItem>
                <CardItem
                    as="p"
                    translateZ="50"
                    className="text-neutral-700 text-xs font-medium text-center w-full mt-1 uppercase tracking-wider"
                >
                    SEBI Registered Advisor
                </CardItem>

                {/* Stats / Trust Score */}
                <CardItem translateZ="40" className="w-full mt-6">
                    <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-yellow-500" />
                            <span className="text-neutral-600 text-sm font-medium">Trust Score</span>
                        </div>
                        <span className="text-green-500 font-bold">{advisor.trustScore || 85}%</span>
                    </div>
                </CardItem>

                {/* Subscription Info */}
                <CardItem translateZ="30" className="w-full mt-3 text-center">
                    <p className="text-neutral-500 text-xs">
                        Monthly Subscription: <span className="text-neutral-900 font-semibold">₹999</span>
                    </p>
                </CardItem>

                {/* Action Button */}
                <CardItem translateZ="20" className="w-full mt-6">
                    <button
                        disabled={isFollowed}
                        onClick={() => onFollow(advisor._id)}
                        // UPDATED BUTTON: Uses your Blue-Purple Gradient
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${isFollowed
                            ? "bg-white/10 text-neutral-400 cursor-not-allowed border border-white/5"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 hover:shadow-blue-500/20 active:scale-95"
                            }`}
                    >
                        {isFollowed ? (
                            <>
                                <Check className="w-4 h-4" /> Following
                            </>
                        ) : (
                            "Follow Advisor"
                        )}
                    </button>
                </CardItem>
            </CardBody>
        </CardContainer>
    );
};

export default AdvisorCard;