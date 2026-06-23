const AlternativeCard = ({ alt }) => {
  const formatWater = (liters) => liters?.toLocaleString() + "L" || "N/A";

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <img
        src={alt.imageUrl}
        alt={alt.name}
        className="w-full h-40 object-cover"
        onError={(e) => { e.target.src = "https://via.placeholder.com/400x300/eee?text=Food" }}
      />
      <div className="p-3">
        <h4 className="font-semibold text-gray-800">{alt.name}</h4>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs font-medium bg-blue-100 text-primary px-2 py-0.5 rounded-full">
            💧 {formatWater(alt.waterUsedLiters)}
          </span>
          <span className="text-xs font-medium bg-green-100 text-success px-2 py-0.5 rounded-full">
            💚 Save {formatWater(alt.waterSavedLiters)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{alt.description}</p>
        <a
          href={alt.googleMapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-white bg-primary px-3 py-1.5 rounded-full"
        >
          📍 Find Near Me
        </a>
      </div>
    </div>
  );
};

export default AlternativeCard;
