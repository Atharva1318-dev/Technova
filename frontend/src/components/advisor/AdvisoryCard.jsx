import { CardContainer, CardBody, CardItem } from "../../components/ui/3d-card";
import { Award } from "lucide-react";

const DEFAULT_AVATAR =
    "https://api.dicebear.com/7.x/initials/svg?seed=Advisor";

const AdvisorCard = ({ advisor, onFollow }) => {
    return (
        <CardContainer className="w-full">
            <CardBody className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-shadow">

                {/* Profile */}
                <CardItem translateZ={60} className="flex justify-center">
                    <img
                        src={advisor.profilePicture || DEFAULT_AVATAR}
                        alt={advisor.name}
                        className="w-20 h-20 rounded-full object-cover border"
                    />
                </CardItem>

                {/* Name */}
                <CardItem translateZ={50} className="mt-4 text-center">
                    <h3 className="text-lg font-bold text-gray-900">
                        {advisor.name}
                    </h3>
                    <p className="text-xs text-gray-500">SEBI Registered</p>
                </CardItem>

                {/* Trust Score */}
                <CardItem translateZ={40} className="mt-4 flex justify-center">
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-800">
                            Trust Score: {advisor.trustScore || 0}
                        </span>
                    </div>
                </CardItem>

                {/* Subscription */}
                <CardItem translateZ={30} className="mt-4 text-center">
                    <p className="text-sm text-gray-700">
                        Subscription:{" "}
                        <span className="font-semibold">₹999 / month</span>
                    </p>
                </CardItem>

                {/* Action */}
                <CardItem translateZ={20} className="mt-5">
                    <button
                        onClick={() => onFollow(advisor._id)}
                        className="w-full py-2.5 bg-gradient-to-r from-[#0077b6] to-[#00b4d8] text-white font-semibold rounded-lg hover:scale-[1.03] transition-transform"
                    >
                        Follow Advisor
                    </button>
                </CardItem>
            </CardBody>
        </CardContainer>
    );
};

export default AdvisorCard;
