console.log("charts.js loaded");

let patrolStatusChart;
let patrolDayChart;
let topOfficerChart;
let siteVolumeChart;

function renderPatrolCharts() {
   
  console.log(
    "Rendering patrol charts..."
  );

  renderPatrolStatusChart();
  renderPatrolsByDayChart();
  renderTopOfficersChart();
  renderPatrolVolumeBySiteChart();
}

function renderPatrolStatusChart() {

  const completed =
    window.activePatrols.filter(
      p => p.completed
    ).length;

  const active =
    window.activePatrols.filter(
      p => !p.completed
    ).length;

  console.log(
    "Completed:",
    completed,
    "Active:",
    active
  );

  const canvas =
    document.getElementById(
      "patrolStatusChart"
    );

  if (!canvas)
    return;

  const chartData =
    completed === 0 &&
    active === 0
      ? [1, 1]
      : [
          completed,
          active
        ];

  patrolStatusChart?.destroy();

  patrolStatusChart =
    new Chart(canvas, {
      type: "doughnut",

      data: {
        labels: [
          "Completed",
          "Active"
        ],

        datasets: [{
          data: chartData
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "55%",

        plugins: {
          legend: {
            position: "top"
          }
        }
      }
    });
}

window.renderPatrolCharts =
  renderPatrolCharts;

window.renderPatrolStatusChart =
  renderPatrolStatusChart;

  function renderPatrolsByDayChart() {

  const canvas =
    document.getElementById(
      "patrolsByDayChart"
    );

  if (!canvas)
    return;

  const counts = {};

  for (let i = 6; i >= 0; i--) {

    const d = new Date();

    d.setDate(
      d.getDate() - i
    );

    const key =
      d.toLocaleDateString();

    counts[key] = 0;
  }

  activePatrols.forEach(
    patrol => {

      if (!patrol.startedAt)
        return;

      const date =
        patrol.startedAt.toDate
          ? patrol.startedAt.toDate()
          : new Date(
              patrol.startedAt
            );

      const key =
        date.toLocaleDateString();

      if (
        counts[key] !==
        undefined
      ) {
        counts[key]++;
      }
    }
  );

  const labels =
    Object.keys(counts);

  const data =
    Object.values(counts);

  if (
  window.patrolsByDayChart &&
  typeof window.patrolsByDayChart.destroy ===
    "function"
) {
  window.patrolsByDayChart.destroy();
}
  

  window.patrolsByDayChart =
    new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label:
            "Patrols",
          data,
          tension: 0.3,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
}

function renderTopOfficersChart() {

  const canvas =
    document.getElementById(
      "topOfficersChart"
    );

  if (!canvas)
    return;

  const stats = {};

  activePatrols.forEach(
    patrol => {

      const officer =
        patrol.officerName ||
        "Unknown";

      stats[officer] =
        (stats[officer] || 0) + 1;
    }
  );

  const sorted =
    Object.entries(stats)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 10);

  const labels =
    sorted.map(
      ([name]) => name
    );

  const data =
    sorted.map(
      ([, count]) => count
    );

  if (
    window.topOfficersChart &&
    typeof window.topOfficersChart.destroy ===
      "function"
  ) {
    window.topOfficersChart.destroy();
  }

  window.topOfficersChart =
    new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Patrols",
          data
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
}

function renderPatrolVolumeBySiteChart() {
    console.log("sites:", window.sites);
console.log("activePatrols:", activePatrols);

  const canvas =
    document.getElementById(
      "patrolVolumeBySiteChart"
    );

  if (!canvas)
    return;

  const stats = {};

  activePatrols.forEach(
  patrol => {

    const siteObj =
  window.sites?.find(
    s => s.id === patrol.siteId
  );

   const site =
  patrol.siteName ||
  siteObj?.name ||
  "Unknown Site";

    stats[site] =
      (stats[site] || 0) + 1;
  }
);

  const sorted =
    Object.entries(stats)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 10);

  const labels =
    sorted.map(
      ([site]) => site
    );

  const data =
    sorted.map(
      ([, count]) => count
    );

  if (
    window.patrolVolumeBySiteChart &&
    typeof window
      .patrolVolumeBySiteChart
      .destroy === "function"
  ) {
    window.patrolVolumeBySiteChart
      .destroy();
  }

  window.patrolVolumeBySiteChart =
    new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Patrols",
          data
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
}