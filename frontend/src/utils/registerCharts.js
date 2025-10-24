// src/utils/registerCharts.js
import {
  Chart as ChartJS,
  LineController,
  LineElement,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";

// Register everything ONCE globally
ChartJS.register(
  LineController, // ✅ required for line charts
  LineElement,
  BarController, // ✅ required for bar charts
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export default ChartJS;
