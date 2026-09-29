import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  searchAddresses,
  reverseGeocode,
  isInsideServiceArea,
  distanceFromBaseKm,
  driveMinutesFromBase,
  SERVICE_AREA,
} from "./location.server";

export const searchAddress = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ query: z.string().min(3).max(200) }).parse(data))
  .handler(async ({ data }) => ({ results: await searchAddresses(data.query) }));

// Coordinates arrive from GPS, map clicks and geocoder results, so they are
// coerced and range-checked here instead of hard-failing on missing values.
const coord = (min: number, max: number) =>
  z.coerce.number().refine((n) => Number.isFinite(n) && n >= min && n <= max, {
    message: `Coordinate must be between ${min} and ${max}`,
  });

export const locatePin = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ lat: coord(-90, 90), lng: coord(-180, 180) }).parse(data))
  .handler(async ({ data }) => {
    const inside = isInsideServiceArea(data.lat, data.lng);
    let address: string;
    try {
      address = await reverseGeocode(data.lat, data.lng);
    } catch {
      // Address lookup is a convenience — coverage must still be answered.
      address = `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`;
    }
    return {
      address,
      inside,
      distanceKm: Math.round(distanceFromBaseKm(data.lat, data.lng)),
      driveMinutes: inside ? await driveMinutesFromBase(data.lat, data.lng) : null,
      areaName: SERVICE_AREA.name,
      radiusKm: SERVICE_AREA.radiusKm,
    };
  });
