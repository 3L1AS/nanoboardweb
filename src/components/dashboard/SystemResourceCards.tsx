/**
 * 系统资源监控卡片组件
 */

import { useTranslation } from "react-i18next";
import { Activity, Cpu, HardDrive, Database, TrendingUp, FileText } from "lucide-react";
import NetworkMonitor from "@/components/NetworkMonitor";
import type { SystemInfo, LogStatistics, NetworkData } from "@/pages/dashboard/types";

interface SystemResourceCardsProps {
  systemInfo: SystemInfo | null;
  logStatistics: LogStatistics | null;
  networkData: NetworkData[];
}

export default function SystemResourceCards({ systemInfo, logStatistics, networkData }: SystemResourceCardsProps) {
  const { t } = useTranslation();

  if (!systemInfo) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 性能监控 */}
      <div className="p-5 bg-white dark:bg-dark-bg-card rounded-lg border border-gray-200 dark:border-dark-border-subtle card-hover transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-dark-text-muted">{t("dashboard.performanceMonitoring")}</span>
        </div>
        <div className="space-y-3">
          {/* CPU */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-gray-600 dark:text-dark-text-secondary">{t("dashboard.cpu")}</span>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-dark-text-primary">{systemInfo.cpu.usage_text}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-dark-bg-hover rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(systemInfo.cpu.usage, 100)}%` }}
              />
            </div>
          </div>
          {/* 内存 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span className="text-xs text-gray-600 dark:text-dark-text-secondary">{t("dashboard.memory")}</span>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-dark-text-primary">{systemInfo.memory.usage_text}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-dark-bg-hover rounded-full h-1.5">
              <div
                className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(systemInfo.memory.usage_percent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">
              {systemInfo.memory.used_text} / {systemInfo.memory.total_text}
            </p>
          </div>
          {/* 交换空间 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs text-gray-600 dark:text-dark-text-secondary">{t("dashboard.swap")}</span>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-dark-text-primary">{systemInfo.swap.usage_text}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-dark-bg-hover rounded-full h-1.5">
              <div
                className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(systemInfo.swap.usage_percent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">
              {systemInfo.swap.used_text} / {systemInfo.swap.total_text}
            </p>
          </div>
        </div>
      </div>

      {/* 网络监控折线图 */}
      <div className="bg-white dark:bg-dark-bg-card rounded-lg border border-gray-200 dark:border-dark-border-subtle card-hover overflow-hidden transition-colors duration-200">
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-dark-text-muted">{t("dashboard.networkMonitoring")}</span>
          </div>
          <NetworkMonitor data={networkData} />
        </div>
      </div>

      {/* 日志监控 */}
      {logStatistics && (
        <div className="p-5 bg-white dark:bg-dark-bg-card rounded-lg border border-gray-200 dark:border-dark-border-subtle card-hover transition-colors duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-dark-text-primary">
              {logStatistics.total} {t("dashboard.entries")}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-3">{t("dashboard.logStatistics")}</p>
          <div className="space-y-2">
            {/* DEBUG */}
            <LogProgressBar
              label="DEBUG"
              count={logStatistics.debug}
              total={logStatistics.total}
              colorClass="bg-gray-600"
              labelColorClass="text-gray-600 dark:text-gray-400"
            />
            {/* INFO */}
            <LogProgressBar
              label="INFO"
              count={logStatistics.info}
              total={logStatistics.total}
              colorClass="bg-blue-600"
              labelColorClass="text-blue-600 dark:text-blue-400"
            />
            {/* WARN */}
            <LogProgressBar
              label="WARN"
              count={logStatistics.warn}
              total={logStatistics.total}
              colorClass="bg-amber-600"
              labelColorClass="text-amber-600 dark:text-amber-400"
            />
            {/* ERROR */}
            <LogProgressBar
              label="ERROR"
              count={logStatistics.error}
              total={logStatistics.total}
              colorClass="bg-red-600"
              labelColorClass="text-red-600 dark:text-red-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LogProgressBar({
  label,
  count,
  total,
  colorClass,
  labelColorClass,
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
  labelColorClass: string;
}) {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0";

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className={labelColorClass}>{label}</span>
        <span className="text-gray-700 dark:text-dark-text-primary font-medium">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-dark-bg-hover rounded-full h-1.5">
        <div
          className={`${colorClass} h-1.5 rounded-full transition-all duration-500`}
          style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}
