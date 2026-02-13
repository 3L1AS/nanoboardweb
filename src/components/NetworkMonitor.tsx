import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown } from "lucide-react";

interface NetworkData {
  timestamp: number;
  upload: number;
  download: number;
}

interface NetworkMonitorProps {
  data?: NetworkData[];
}

export default function NetworkMonitor({ data = [] }: NetworkMonitorProps) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 128 });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 只显示最近60个数据点（60秒）
  const displayData = data.slice(-60);
  const maxDataPoints = 60;

  // 计算Y轴范围
  const allValues = displayData.flatMap(d => [d.upload, d.download]);
  const maxValue = Math.max(...allValues, 100) / 1024; // 转换为 MB/s
  const yAxisMax = Math.ceil(maxValue * 1.2); // 留20%顶部空间

  // 计算路径
  const uploadPath = displayData.map((d, i) => {
    const x = (i / (maxDataPoints - 1)) * dimensions.width;
    const y = dimensions.height - (d.upload / 1024 / yAxisMax) * dimensions.height;
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  const downloadPath = displayData.map((d, i) => {
    const x = (i / (maxDataPoints - 1)) * dimensions.width;
    const y = dimensions.height - (d.download / 1024 / yAxisMax) * dimensions.height;
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  // 当前值（使用最近几个数据点的平均值，避免突然的0）
  const currentUpload = displayData.length > 0
    ? displayData.slice(-3).reduce((sum, d) => sum + d.upload, 0) / Math.min(displayData.length, 3)
    : 0;
  const currentDownload = displayData.length > 0
    ? displayData.slice(-3).reduce((sum, d) => sum + d.download, 0) / Math.min(displayData.length, 3)
    : 0;

  function formatSpeed(bytes: number): string {
    // 如果值非常小但大于0，显示最小值而不是0
    const displayValue = bytes > 0 && bytes < 0.1 ? 0.1 : bytes;

    if (displayValue < 1024) {
      return `${displayValue.toFixed(1)} B/s`;
    } else if (displayValue < 1024 * 1024) {
      return `${(displayValue / 1024).toFixed(1)} KB/s`;
    } else {
      return `${(displayValue / 1024 / 1024).toFixed(2)} MB/s`;
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* 标题和当前值 */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <div className="text-xs">
            <span className="text-gray-500 dark:text-dark-text-muted">{t("dashboard.upload")}: </span>
            <span className="font-medium text-gray-700 dark:text-dark-text-secondary">{formatSpeed(currentUpload)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <div className="text-xs">
            <span className="text-gray-500 dark:text-dark-text-muted">{t("dashboard.download")}: </span>
            <span className="font-medium text-gray-700 dark:text-dark-text-secondary">{formatSpeed(currentDownload)}</span>
          </div>
        </div>
      </div>

      {/* 折线图 */}
      <div className="flex-1 bg-gray-50 dark:bg-dark-bg-sidebar rounded-lg border border-gray-200 dark:border-dark-border-subtle relative overflow-hidden transition-colors duration-200">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* 网格线 */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <line
              key={ratio}
              x1="0"
              y1={dimensions.height * (1 - ratio)}
              x2={dimensions.width}
              y2={dimensions.height * (1 - ratio)}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="text-gray-300 dark:text-dark-border-default opacity-30 dark:opacity-50"
            />
          ))}

          {/* 上行折线 */}
          <path
            d={uploadPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* 下行折线 */}
          <path
            d={downloadPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        </svg>
      </div>
    </div>
  );
}
