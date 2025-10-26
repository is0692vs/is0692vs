interface VscodeStatsHistory {
  date: string;
  extensions: Record<string, number>;
}

export function generateVscodeChartUrl(history: VscodeStatsHistory[]): string {
  if (history.length === 0) {
    return "";
  }

  const labels = history.map((h) => h.date);
  // Collect all unique extension names from all history entries
  const extensionNamesSet = new Set<string>();
  history.forEach((h) => {
    Object.keys(h.extensions).forEach((ext) => extensionNamesSet.add(ext));
  });
  const extensionNames = Array.from(extensionNamesSet);

  const datasets = extensionNames.map((ext, index) => {
    const colors = ["#9966FF", "#FF9F40", "#FF6384", "#36A2EB"];
    return {
      label: ext,
      data: history.map((h) => h.extensions[ext] || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: "transparent",
      tension: 0.4,
    };
  });

  const chartConfig = {
    type: "line",
    data: {
      labels,
      datasets,
    },
    options: {
      title: {
        display: true,
        text: "VSCode Extension Installs",
      },
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  };

  const encoded = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?c=${encoded}&width=800&height=400`;
}
