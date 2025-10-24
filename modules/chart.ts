interface StatsHistory {
  date: string;
  packages: Record<string, number>;
}

export function generateChartUrl(history: StatsHistory[]): string {
  if (history.length === 0) {
    return "";
  }

  const labels = history.map((h) => h.date);
  const packageNames = Object.keys(history[0]?.packages || {});

  const datasets = packageNames.map((pkg, index) => {
    const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"];
    return {
      label: pkg,
      data: history.map((h) => h.packages[pkg] || 0),
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
        text: "npm Weekly Downloads",
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
