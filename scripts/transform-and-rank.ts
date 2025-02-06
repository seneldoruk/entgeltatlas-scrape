// Read the raw data
const rawData = JSON.parse(await Bun.file("./out/results_raw.json").text());

// Read and process the kldb_beruf.csv file
const kldbBerufContent = await Bun.file("./data/kldb_beruf.csv").text();
const kldbBerufMap = new Map<string, string[]>();

// Skip the header line and process each line
kldbBerufContent
  .split("\n")
  .slice(1)
  .forEach((line) => {
    if (!line.trim()) return;
    const [beruf, kldb] = line.split(";");
    if (!kldbBerufMap.has(kldb.trim())) {
      kldbBerufMap.set(kldb.trim(), []);
    }
    kldbBerufMap.get(kldb.trim())?.push(beruf);
  });

// Transform the data
const transformedData = Object.entries(rawData)
  .map(([key, value]: [string, any]) => {
    try {
      const median = value["0"].entgelt;
      const q25 = value["0"].entgeltQ25;
      const q75 = value["0"].entgeltQ75;
      return {
        kldb: key,
        name: value.occupation_name,
        berufe: kldbBerufMap.get(key) || [],
        entgelt: median == -1 || median == -2 ? "n/a" : median,
        entgeltQ25: q25 == -1 || q25 == -2 ? "n/a" : q25,
        entgeltQ75: q75 == -1 || q75 == -2 ? "n/a" : q75,
      };
    } catch (e) {
      console.error(`Error transforming ${key}`);
      console.error(value);
      console.error(e);
      return null;
    }
  })
  .filter((item) => item !== null)
  // Sort by entgelt in descending order
  .sort((a, b) => {
    // If both have valid entgelt values, compare them
    if (a?.entgelt !== "n/a" && b?.entgelt !== "n/a") {
      return b?.entgelt - a?.entgelt;
    }

    // If both have valid Q25 values, compare them
    if (a?.entgeltQ25 !== "n/a" && b?.entgeltQ25 !== "n/a") {
      return b?.entgeltQ25 - a?.entgeltQ25;
    }

    // If both have valid Q75 values, compare them
    if (a?.entgeltQ75 !== "n/a" && b?.entgeltQ75 !== "n/a") {
      return b?.entgeltQ75 - a?.entgeltQ75;
    }

    // If we get here, at least one of the items has no valid comparison values
    // Push items with no valid values to the end
    if (
      a?.entgelt === "n/a" &&
      b?.entgelt === "n/a" &&
      a?.entgeltQ25 === "n/a" &&
      b?.entgeltQ25 === "n/a" &&
      a?.entgeltQ75 === "n/a" &&
      b?.entgeltQ75 === "n/a"
    ) {
      return 0; // both have no valid values, consider them equal
    }

    // Push items with no valid values to the end
    if (
      a?.entgelt === "n/a" &&
      a?.entgeltQ25 === "n/a" &&
      a?.entgeltQ75 === "n/a"
    )
      return 1;
    if (
      b?.entgelt === "n/a" &&
      b?.entgeltQ25 === "n/a" &&
      b?.entgeltQ75 === "n/a"
    )
      return -1;

    return 0;
  });

// Write the transformed and sorted data
await Bun.write(
  "./out/results_ranked.json",
  JSON.stringify(transformedData, null, 2)
);

console.log(`Transformed and ranked ${transformedData.length} occupations.`);
