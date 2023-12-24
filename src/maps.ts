import {
  Client,
  GeocodeResult,
  PlaceData,
  TravelMode,
} from "@googlemaps/google-maps-services-js";
import "dotenv/config";
import {
  LatLng,
  LatLngLiteral,
} from "@googlemaps/google-maps-services-js/dist/common";
import { isNil } from "./utils";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
if (!API_KEY) {
  throw new Error("No API key specified.");
}

export const mapsClient = new Client({});

export interface Place {
  name: string;
  geo: GeocodeResult;
}

export interface RightMoveStation extends Place {
  rightMoveId: string;
}

export interface Journey {
  origin: Place;
  distanceSeconds: number;
}
export interface StationWithJourneys extends RightMoveStation {
  journeys: Journey[];
}

export const getStationGeo = async (
  stationName: string,
): Promise<GeocodeResult | null> => {
  try {
    const response = await mapsClient.geocode({
      params: {
        address: stationName,
        key: API_KEY,
      },
    });

    return response.data.results[0] ?? null;
  } catch (error) {
    return null;
  }
};

// export const getPlacesNearby = async (location: LatLng) => {
//   for (let attempts = 0; attempts < MAX_RADIUS_FETCHES; attempts++) {
//     console.log(`Fetch attempt ${attempts}`);
//     const placesResponse = await mapsClient.placesNearby({
//       params: {
//         location,
//         radius: radiusMeters,
//         type,
//         key: API_KEY,
//         pagetoken: pageToken,
//       },
//     });
//     pageToken = placesResponse.data.next_page_token;
//     places.push(...placesResponse.data.results);
//
//     if (!pageToken) {
//       break;
//     }
//     await delay(PAGE_DELAY_MS);
//   }
// };

export const filterStationsByDurationToLocation = async (
  stations: (RightMoveStation | StationWithJourneys)[],
  origin: Place,
  durationSeconds: number,
): Promise<StationWithJourneys[]> => {
  let stationsWithinDistance: StationWithJourneys[] = [];
  for (let i = 0; i < stations.length; i++) {
    if (i % 10 === 0) {
      console.log(`Processing ${i}/${stations.length}`);
    }
    const station = stations[i];
    const directionsResponse = (
      await mapsClient.directions({
        params: {
          origin: origin.geo.geometry.location,
          destination: station.geo.geometry.location,
          mode: TravelMode.transit,
          key: API_KEY,
        },
      })
    ).data;

    const duration = directionsResponse.routes[0]?.legs[0]?.duration.value;

    if (isNil(duration) || !station.name) {
      throw new Error(`Invalid station`);
    }

    if (duration < durationSeconds) {
      const newJourney = {
        origin,
        distanceSeconds: duration,
      };
      const journeys =
        "journeys" in station
          ? [...station.journeys, newJourney]
          : [newJourney];
      stationsWithinDistance.push({
        ...station,
        journeys,
      });
    }
  }
  return stationsWithinDistance;
};
