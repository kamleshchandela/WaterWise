import { useNavigate } from "react-router-dom";

const ImageCard = ({ analysis }) => {
  const navigate = useNavigate();

  const formatWater = (liters) => {
    return liters?.toLocaleString() + "L" || "N/A";
  };

  return (
    <div
      onClick={() => navigate(`/analysis/${analysis._id}`)}
      className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer active:scale-95 transition-transform"
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        <img
          src={analysis.imageUrl}
          alt={analysis.foodItemDetected || "Food"}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-2">
        <p className="text-sm font-medium text-gray-800 truncate">
          {analysis.foodItemDetected || "Unknown Food"}
        </p>
        <div className="flex items-center mt-1">
          <span className="text-xs font-semibold bg-blue-100 text-primary px-2 py-0.5 rounded-full">
            💧 {formatWater(analysis.waterUsedLiters)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
