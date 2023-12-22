import * as fs from "fs";
import { parse } from "csv-parse";
import { z } from "zod";
import { getStationLatLng, Place } from "./maps";
import { isNotNil } from "./utils";

const stationRecord = z.object({
  Name: z.string(),
});

const main = async () => {
  const tflStationsRaw = fs.readFileSync("./data/Stations.csv", "utf8");
  const tflStationsParsed = await new Promise((resolve, reject) => {
    parse(
      tflStationsRaw,
      {
        columns: true,
        skip_empty_lines: true,
      },
      (err, records) => {
        if (err) {
          reject(err);
        }
        resolve(records);
      },
    );
  });
  const tflStations = stationRecord
    .array()
    .parse(tflStationsParsed)
    .map((s) => s.Name);

  const nationalRailStationsRaw = fs.readFileSync(
    "./data/gb_national_rail_stations.tsv",
    "utf8",
  );
  const nationalRailStationLines = nationalRailStationsRaw.split("\n");
  const nationalRailStations = nationalRailStationLines
    .map((line) => {
      const [name] = line.split("\t");
      return name.trim();
    })
    .filter((s) => !!s);

  const allStations = Array.from(
    new Set([...tflStations, ...nationalRailStations]),
  ).sort();

  const enriched = (
    await Promise.all(
      allStations.map(async (station): Promise<Place | null> => {
        for (const suffix of [" station", " railway station", " interchange"]) {
          const suffixedName = station + suffix;
          const latLng = await getStationLatLng(suffixedName);
          if (!latLng) {
            continue;
          }
          console.log(`Enriched ${station}`);
          return {
            name: suffixedName,
            latLng,
          };
        }
        return null;
      }),
    )
  ).filter(isNotNil);

  console.log(enriched.length);

  fs.writeFileSync(
    "./data/all_stations.json",
    JSON.stringify(enriched, null, 2),
  );
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
