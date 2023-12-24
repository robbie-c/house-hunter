import * as fs from "fs";
import { parse } from "csv-parse";
import { z } from "zod";
import { getStationGeo, Place } from "./maps";
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
      const [rawName] = line.split("\t");
      return rawName
        .trim()
        .replace("(Cheshire)", "(Ches.)")
        .replace("(Lancashire)", "(Lancs.)");
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
          const geo = await getStationGeo(suffixedName + ", uk");
          if (!geo) {
            continue;
          }
          if (
            geo.address_components.some(
              (c) =>
                c.short_name.includes("Northern Ireland") ||
                c.long_name.includes("Northern Ireland"),
            )
          ) {
            // no Rightmove in NI
            return null;
          }
          console.log(`Enriched ${station}`);
          return {
            name: suffixedName,
            geo,
          };
        }
        return null;
      }),
    )
  ).filter(isNotNil);

  console.log(enriched.length);

  fs.writeFileSync(
    "./intermediates/01_all_stations.json",
    JSON.stringify(enriched, null, 2),
  );
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
