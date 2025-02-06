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
        entgelt: median < 0 ? "n/a" : median,
        entgeltQ25: q25 < 0 ? "n/a" : q25,
        entgeltQ75: q75 < 0 ? "n/a" : q75,
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
    const getMedian = (item: any) => {
      if (item.entgelt !== "n/a") return item.entgelt;
      if (item.entgeltQ25 !== "n/a") return 7100;
      return 0;
    };

    const getQ25 = (item: any) => {
      if (item.entgeltQ25 !== "n/a") return item.entgeltQ25;
      return 0;
    };

    const medianA = getMedian(a);
    const medianB = getMedian(b);

    if (medianA !== medianB) {
      return medianB - medianA;
    }

    const q25A = getQ25(a);
    const q25B = getQ25(b);

    return q25B - q25A;
  });

// Write the transformed and sorted data
await Bun.write(
  "./out/results_ranked.json",
  JSON.stringify(transformedData, null, 2)
);

console.log(`Transformed and ranked ${transformedData.length} occupations.`);
