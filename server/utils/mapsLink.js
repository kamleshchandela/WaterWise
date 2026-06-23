export const buildGoogleMapsLink = (searchQuery, district, state) => {
  const fullQuery = `${searchQuery} in ${district} ${state} India`;
  const encoded = encodeURIComponent(fullQuery);
  return `https://www.google.com/maps/search/${encoded}`;
};
