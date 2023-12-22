import allStations from "../data/all_stations.json";
import { haversineDistanceMeters, sortBySortNumericKey } from "./utils";
import { filterStationsByDurationToLocation, Place } from "./maps";
import * as fs from "fs";

const MAXIMUM_TRAVEL_TIME_SECONDS = 60 * 75; // 75 minutes
const MAXIMUM_RADIUS_METERS = 20 * 1000; // 20km

const travelLocations: Place[] = [
  {
    name: "Waterloo, London",
    latLng: {
      lat: 51.5049,
      lng: -0.1137,
    },
  },
];

async function getStationsWithinRadius(
  location: Place,
  radiusMeters: number,
): Promise<Place[]> {
  return allStations.filter(({ name, latLng }) => {
    const distance = haversineDistanceMeters(latLng, location.latLng);
    return distance < radiusMeters;
  });
}

const main = async () => {
  const stations = await getStationsWithinRadius(
    travelLocations[0],
    MAXIMUM_RADIUS_METERS,
  );

  let stationsWithJourneys = await filterStationsByDurationToLocation(
    stations,
    travelLocations[0],
    MAXIMUM_TRAVEL_TIME_SECONDS,
  );

  stationsWithJourneys = sortBySortNumericKey(
    stationsWithJourneys,
    (s) => s.journeys[0].distanceSeconds,
  );

  fs.writeFileSync(
    "output.json",
    JSON.stringify(stationsWithJourneys, null, 2),
  );
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
