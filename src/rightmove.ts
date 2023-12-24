export enum Price {
  "price700000" = 700000,
  "price550000" = 550000,
}

import { z } from "zod";

// Add headers so we look more like normal web traffic and don't get blocked
const headers = {
  Accept: "application/json, text/plain, */*",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "en-GB,en;q=0.5",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  DNT: "1",
  Host: "www.rightmove.co.uk",
  Pragma: "no-cache",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "Sec-GPC": "1",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const RightMoveSearchLocation = z.object({
  displayName: z.string(),
  locationIdentifier: z.string(),
  normalisedSearchTerm: z.string(),
});
export type RightMoveSearchLocation = z.infer<typeof RightMoveSearchLocation>;

const LocationIdentifierResponse = z.object({
  typeAheadLocations: z.array(RightMoveSearchLocation),
});

export const getLocationIdentifier = async (
  location: string,
): Promise<RightMoveSearchLocation | null> => {
  location = location
    .replace(/&/g, "and")
    .replace(/[.()]/g, "")
    .replace(/-/g, " ");

  let path = "https://www.rightmove.co.uk/typeAhead/uknostreet";
  for (let i = 0; i < (location.length + 1) / 2; i++) {
    path =
      path +
      "/" +
      encodeURIComponent(location.slice(i * 2, i * 2 + 2).toUpperCase());
  }
  const response = await fetch(path, {
    headers,
    method: "GET",
  });
  let json: unknown;
  try {
    json = await response.json();
  } catch (e) {
    console.log(`No results for ${location}`);
    return null;
  }
  const parsedResponse = LocationIdentifierResponse.parse(json);

  const stations = parsedResponse.typeAheadLocations.filter((l) =>
    l.locationIdentifier.startsWith("STATION^"),
  );
  const firstResult = stations[0];
  if (!firstResult) {
    console.log(
      `No station for ${location}, got ${JSON.stringify(
        parsedResponse.typeAheadLocations,
        null,
        2,
      )}`,
    );
    return null;
  }
  return firstResult;
};

const Property = z.object({
  id: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  numberOfImages: z.number(),
  numberOfFloorplans: z.number(),
  numberOfVirtualTours: z.number(),
  summary: z.string(),
  displayAddress: z.string(),
  countryCode: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  propertyImages: z.object({
    images: z.array(
      z.object({
        srcUrl: z.string(),
        url: z.string(),
        caption: z.string().nullable(),
      }),
    ),
    mainImageSrc: z.string(),
    mainMapImageSrc: z.string(),
  }),
  propertySubType: z.string(),
  listingUpdate: z.object({
    listingUpdateReason: z.string(),
    listingUpdateDate: z.string(),
  }),
  premiumListing: z.boolean(),
  featuredProperty: z.boolean(),
  price: z.object({
    amount: z.number(),
    frequency: z.string(),
    currencyCode: z.string(),
    displayPrices: z.array(
      z.object({
        displayPrice: z.string(),
        displayPriceQualifier: z.string(),
      }),
    ),
  }),
  customer: z.object({
    branchId: z.number(),
    brandPlusLogoURI: z.string(),
    contactTelephone: z.string(),
    branchDisplayName: z.string(),
    branchName: z.string(),
    brandTradingName: z.string(),
    branchLandingPageUrl: z.string(),
    development: z.boolean(),
    showReducedProperties: z.boolean(),
    commercial: z.boolean(),
    showOnMap: z.boolean(),
    enhancedListing: z.boolean(),
    developmentContent: z.nullable(z.unknown()),
    buildToRent: z.boolean(),
    buildToRentBenefits: z.array(z.unknown()),
    brandPlusLogoUrl: z.string(),
  }),
  distance: z.number(),
  transactionType: z.string(),
  productLabel: z.object({
    productLabelText: z.string(),
    spotlightLabel: z.boolean(),
  }),
  commercial: z.boolean(),
  development: z.boolean(),
  residential: z.boolean(),
  students: z.boolean(),
  auction: z.boolean(),
  feesApply: z.boolean(),
  feesApplyText: z.string().nullable(),
  displaySize: z.string(),
  showOnMap: z.boolean(),
  propertyUrl: z.string(),
  contactUrl: z.string(),
  staticMapUrl: z.string().nullable(),
  channel: z.string(),
  firstVisibleDate: z.string(),
  keywords: z.array(z.string()),
  keywordMatchType: z.string(),
  saved: z.boolean(),
  hidden: z.boolean(),
  onlineViewingsAvailable: z.boolean(),
  lozengeModel: z.object({
    matchingLozenges: z.array(z.unknown()),
  }),
  hasBrandPlus: z.boolean(),
  displayStatus: z.string(),
  enquiredTimestamp: z.string().nullable(),
  heading: z.string(),
  addedOrReduced: z.string(),
  formattedBranchName: z.string(),
  formattedDistance: z.string(),
  propertyTypeFullDescription: z.string(),
  isRecent: z.boolean(),
  enhancedListing: z.boolean(),
});

const RightMoveSearchResponse = z.object({
  properties: z.array(Property),
});

export const searchRightMove = async ({
  minPrice = Price.price550000,
  maxPrice = Price.price700000,
}: {
  minPrice: Price;
  maxPrice: Price;
}) => {
  const params = new URLSearchParams({
    locationIdentifier: "STATION^6221",
    maxBedrooms: "3",
    minBedrooms: "2",
    maxPrice: maxPrice.toString(),
    minPrice: minPrice.toString(),
    numberOfPropertiesPerPage: "24",
    radius: "3.0",
    sortType: "2",
    index: "0",
    "propertyTypes[0]": "detached",
    "propertyTypes[1]": "semi-detached",
    "propertyTypes[2]": "terraced",
    includeSSTC: "false",
    viewType: "LIST",
    "mustHave[0]": "garden",
    channel: "BUY",
    areaSizeUnit: "sqm",
    currencyCode: "GBP",
    isFetching: "false",
  });
  const url = `https://www.rightmove.co.uk/api/_search?${params.toString()}`;

  const response = await fetch(url, {
    headers,
    method: "GET",
  });
  const json = await response.json();
  const parsedResponse = RightMoveSearchResponse.parse(json);
  console.log(JSON.stringify(parsedResponse.properties, null, 2));
};

//https://www.rightmove.co.uk/typeAhead/uknostreet/SA/IN/T%20/AL/BA/NS/%20S/TA/TI/ON
//https://www.rightmove.co.uk/typeAhead/uknostreet/ST/%20A/LB/AN/S%20/ST/AT/IO/N

// const main = async () => {
//   const result = await getLocationIdentifier("saint albans station");
//   console.log(result);
// await searchRightMove({
//   minPrice: Price.price550000,
//   maxPrice: Price.price700000,
// });
// };

// main().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });
