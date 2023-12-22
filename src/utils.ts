import formatDuration from "format-duration";
import { LatLngLiteral } from "@googlemaps/google-maps-services-js/dist/common";

export const prettyDuration = (durationSeconds: number) => {
  return formatDuration(durationSeconds * 1000);
};

export const isNil = <T extends any>(
  value: T | null | undefined,
): value is null | undefined => {
  return value === null || value === undefined;
};

export const isNotNil = <T extends any>(
  value: T | null | undefined,
): value is T => {
  return value !== null && value !== undefined;
};

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const sortBySortNumericKey = <T extends any>(
  xs: T[] | Iterable<T>,
  keyFunction: (x: T) => number,
) => {
  const xsArray = Array.isArray(xs) ? xs : Array.from(xs);
  return xsArray.sort((a, b) => keyFunction(a) - keyFunction(b));
};

export const sortBySortStringKey = <T extends any>(
  xs: T[] | Iterable<T>,
  keyFunction: (x: T) => string,
) => {
  const xsArray = Array.isArray(xs) ? xs : Array.from(xs);
  return xsArray.sort((a, b) => keyFunction(a).localeCompare(keyFunction(b)));
};

export const haversineDistanceMeters = (
  { lat: lat1, lng: lng1 }: LatLngLiteral,
  { lat: lat2, lng: lng2 }: LatLngLiteral,
): number => {
  const R = 6371071; // Radius of the Earth in meters
  const rlat1 = lat1 * (Math.PI / 180); // Convert degrees to radians
  const rlat2 = lat2 * (Math.PI / 180); // Convert degrees to radians
  const difflat = rlat2 - rlat1; // Radian difference (latitudes)
  const difflon = (lng2 - lng1) * (Math.PI / 180); // Radian difference (longitudes)

  return (
    2 *
    R *
    Math.asin(
      Math.sqrt(
        Math.sin(difflat / 2) * Math.sin(difflat / 2) +
          Math.cos(rlat1) *
            Math.cos(rlat2) *
            Math.sin(difflon / 2) *
            Math.sin(difflon / 2),
      ),
    )
  );
};
