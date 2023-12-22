import {
  Client,
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
  latLng: LatLngLiteral;
}

export interface Journey {
  origin: Place;
  distanceSeconds: number;
}
export interface PlaceWithJourneys extends Place {
  journeys: Journey[];
}

export const getStationLatLng = async (stationName: string) => {
  try {
    const response = await mapsClient.geocode({
      params: {
        address: stationName,
        key: API_KEY,
      },
    });

    if (response.data.results.length > 0) {
      return response.data.results[0].geometry.location;
    } else {
      return null;
    }
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
  stations: (Place | PlaceWithJourneys)[],
  origin: Place,
  durationSeconds: number,
): Promise<PlaceWithJourneys[]> => {
  let stationsWithinDistance: PlaceWithJourneys[] = [];
  for (let i = 0; i < stations.length; i++) {
    if (i % 10 === 0) {
      console.log(`Processing ${i}/${stations.length}`);
    }
    const station = stations[i];
    const directionsResponse = (
      await mapsClient.directions({
        params: {
          origin: origin.latLng,
          destination: station.latLng,
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
