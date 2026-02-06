// ABOUTME: Chart.js initialization module that registers required components.
// ABOUTME: Import this module to ensure Chart.js is properly configured.
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export { ChartJS };
