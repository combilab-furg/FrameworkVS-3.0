import { useEffect, useState } from "react";
import Papa from "papaparse";
import api from "../../axios";

export default function ResultsTable({ csvPath }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadCsv() {
      try {
        const resp = await api.get("/advanced/scoring/results", {
          params: { path: csvPath },
          responseType: "blob",
        });
        const text = await resp.data.text();

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => setData(results.data),
        });
      } catch (err) {
        console.error("Failed to load CSV:", err);
      }
    }

    loadCsv();
  }, [csvPath]);

  if (!data.length) return <p>No results yet.</p>;

  return (
    <div className="overflow-auto mt-4 border rounded">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-200">
          <tr>
            {Object.keys(data[0]).map((col) => (
              <th key={col} className="px-4 py-2 border text-left">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-100">
              {Object.values(row).map((val, j) => (
                <td key={j} className="px-4 py-2 border">{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
