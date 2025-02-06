import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";

interface SalaryData {
  kldb: string;
  name: string;
  berufe: string[];
  entgelt: string | number;
  entgeltQ25: number | string;
  entgeltQ75: string | number;
}

interface SalaryTableProps {
  data: SalaryData[];
}

const formatSalary = (value: string | number) => {
  if (value === "n/a") return "Nicht verfügbar";
  return `${value}€`;
};

const formatSalaries = (
  q25: string | number,
  median: string | number,
  q75: string | number
) => {
  if (q25 !== "n/a") {
    if (median == "n/a") median = ">7100";
    if (q75 == "n/a") q75 = ">7100";
  }
  return [formatSalary(q25), formatSalary(median), formatSalary(q75)];
};

const JobList = React.memo<{
  berufe: string[];
  globalExpanded: { state: boolean; timestamp: number };
}>(({ berufe, globalExpanded }) => {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [isOpen, setIsOpen] = useState(globalExpanded.state);

  useEffect(() => {
    setIsOpen(globalExpanded.state);
    if (detailsRef.current) {
      detailsRef.current.open = globalExpanded.state;
    }
  }, [globalExpanded]);

  return (
    <details
      ref={detailsRef}
      className="group marker:content-[''] relative"
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer list-none">
        <span className="text-blue-600 hover:text-blue-800 font-medium">
          Berufe {isOpen ? "verbergen" : "anzeigen"}
        </span>
      </summary>
      <ul className="list-disc list-inside mt-2">
        {berufe.map((beruf, i) => (
          <li key={i} className="mb-1 text-sm">
            {beruf}
          </li>
        ))}
      </ul>
    </details>
  );
});

const TableRow = React.memo<{
  item: SalaryData;
  index: number;
  globalExpanded: { state: boolean; timestamp: number };
}>(({ item, index, globalExpanded }) => {
  const formattedSalaries = useMemo(
    () => formatSalaries(item.entgeltQ25, item.entgelt, item.entgeltQ75),
    [item.entgeltQ25, item.entgelt, item.entgeltQ75]
  );

  return (
    <tr className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
      <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <JobList berufe={item.berufe} globalExpanded={globalExpanded} />
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {formattedSalaries[0]}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {formattedSalaries[1]}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {formattedSalaries[2]}
      </td>
    </tr>
  );
});

const SalaryTable: React.FC<SalaryTableProps> = ({ data }) => {
  const [globalExpanded, setGlobalExpanded] = useState({
    state: true,
    timestamp: Date.now(),
  });

  const toggleAll = useCallback((expanded: boolean) => {
    setGlobalExpanded({
      state: expanded,
      timestamp: Date.now(),
    });
  }, []);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => toggleAll(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          Alle Berufe anzeigen
        </button>
        <button
          onClick={() => toggleAll(false)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
        >
          Alle Berufe verbergen
        </button>
      </div>
      <div className="w-full overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="w-1/4 px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                Berufsbezeichnung
              </th>
              <th className="w-1/3 px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                Berufe
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                25% Quartil
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                Median
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                75% Quartil
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, index) => (
              <TableRow
                key={item.kldb}
                item={item}
                index={index}
                globalExpanded={globalExpanded}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalaryTable;
