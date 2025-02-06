// Read KLDB IDs and names from CSV file
interface KldbEntry {
  id: string;
  name: string;
}

const kldbEntries: KldbEntry[] = await Bun.file("./data/kldb.csv")
  .text()
  .then((text) =>
    text
      .split("\n")
      .slice(1) // Skip header
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const [id, name] = line.split(";");
        return { id: id.trim(), name: name.trim() };
      })
  );

const API_KEY = "infosysbub-ega";
const BASE_URL =
  "https://rest.arbeitsagentur.de/infosysbub/entgeltatlas/pc/v1/entgelte";

async function fetchData(entry: KldbEntry) {
  try {
    //[r]egion, [g]ender, [a]ge, [b]ranch = 1 = gesamt
    const response = await fetch(`${BASE_URL}/${entry.id}?r=1&g=1&a=1&b=1`, {
      headers: {
        "x-api-key": API_KEY,
      },
    });

    if (!response.ok) {
      console.error(
        `Error fetching ID ${entry.id} (${entry.name}): ${response.status}`
      );
      return null;
    }
    const res = await response.json();
    return {
      ...res,
      occupation_name: entry.name,
    };
  } catch (error) {
    console.error(`Failed to fetch ID ${entry.id} (${entry.name}):`, error);
    return null;
  }
}

async function main() {
  const results: Record<string, any> = {};
  let count = 0;
  const total = kldbEntries.length;

  // Process entries in batches to avoid overwhelming the API
  const BATCH_SIZE = 100;
  for (let i = 0; i < kldbEntries.length; i += BATCH_SIZE) {
    const batch = kldbEntries.slice(i, i + BATCH_SIZE);
    const promises = batch.map((entry) => fetchData(entry));

    const batchResults = await Promise.all(promises);

    batchResults.forEach((result, index) => {
      if (result) {
        results[batch[index].id] = result;
      }
      count++;
      if (count % 100 === 0) {
        console.log(`Progress: ${count}/${total}`);
      }
    });
  }

  const rawOutput = JSON.stringify(results, null, 2);
  await Bun.write("./out/results_raw.json", rawOutput);

  console.log("Scraping completed!");
  console.log(`Processed ${Object.keys(results).length} successful entries`);
}

main().catch(console.error);
