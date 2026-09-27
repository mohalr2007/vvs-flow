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

export const locatePin = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).parse(data))
  .handler(async ({ data }) => {
    const inside = isInsideServiceArea(data.lat, data.lng);
    return {
      address: await reverseGeocode(data.lat, data.lng),
      inside,
      distanceKm: Math.round(distanceFromBaseKm(data.lat, data.lng)),
      driveMinutes: inside ? await driveMinutesFromBase(data.lat, data.lng) : null,
      areaName: SERVICE_AREA.name,
      radiusKm: SERVICE_AREA.radiusKm,
    };
  });
