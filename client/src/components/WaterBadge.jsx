const WaterBadge = ({ liters, size = "md" }) => {
  const formatted = liters?.toLocaleString() + "L" || "N/A";

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-lg px-4 py-2"
  };

  return (
    <span className={`font-semibold bg-blue-100 text-primary rounded-full inline-flex items-center gap-1 ${sizeClasses[size]}`}>
      💧 {formatted}
    </span>
  );
};

export default WaterBadge;
