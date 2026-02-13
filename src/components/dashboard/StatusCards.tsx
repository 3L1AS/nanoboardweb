/**
 * 状态卡片组件
 */

import { useTranslation } from "react-i18next";
import { Activity, Zap, Clock, Info } from "lucide-react";
import type { Status, NanobotVersion } from "@/pages/dashboard/types";

interface StatusCardsProps {
  status: Status;
  nanobotVersion: NanobotVersion | null;
}

export default function StatusCards({ status, nanobotVersion }: StatusCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* 运行状态卡片 */}
      <div className="p-5 bg-white dark:bg-dark-bg-card rounded-lg border border-gray-200 dark:border-dark-border-subtle card-hover transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-1">{t("dashboard.systemStatus")}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary">
          {status.running ? t("dashboard.active") : t("dashboard.offline")}
        </p>
      </div>

      {/* 端口卡片 */}
      <div className="p-5 bg-white dark:bg-dark-bg-card rounded-lg border border-gray-200 dark:border-dark-border-subtle card-hover transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-1">{t("dashboard.servicePort")}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary">
          {status.port || "N/A"}
        </p>
      </div>

      {/* 运行时间卡片 */}
      <div className="p-5 bg-white dark:bg-dark-bg-card rounded-lg border border-gray-200 dark:border-dark-border-subtle card-hover transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-1">{t("dashboard.uptime")}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary">
          {status.uptime || "--:--"}
        </p>
      </div>

      {/* 版本信息卡片 */}
      <div className="p-5 bg-white dark:bg-dark-bg-card rounded-lg border border-gray-200 dark:border-dark-border-subtle card-hover transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
            nanobotVersion?.installed
              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          }`}>
            {nanobotVersion?.installed ? t("dashboard.installed") : t("dashboard.notInstalled")}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-1">{t("dashboard.version")}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary truncate" title={nanobotVersion?.version || nanobotVersion?.message || t("dashboard.detecting")}>
          {nanobotVersion?.version || nanobotVersion?.message || t("dashboard.detecting")}
        </p>
      </div>
    </div>
  );
}
