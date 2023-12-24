import all_stations from "../intermediates/01_all_stations.json";
import { getLocationIdentifier, RightMoveSearchLocation } from "./rightmove";
import * as fs from "fs";
import { GeocodeResult } from "@googlemaps/google-maps-services-js";

// need to cast here as google don't actually return the type they say they do
const allStations = all_stations as {
  name: string;
  geo: GeocodeResult;
}[];

const main = async () => {
  const results: {
    geo: GeocodeResult;
    rightmove: RightMoveSearchLocation;
  }[] = [];
  for (const station of allStations) {
    const searchLocation = await getLocationIdentifier(station.name);
    if (!searchLocation) {
      continue;
    }
    results.push({
      geo: station.geo,
      rightmove: searchLocation,
    });
  }
  fs.writeFileSync(
    "intermediates/02_add_rightmove_ids.json",
    JSON.stringify(results, null, 2),
  );
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
