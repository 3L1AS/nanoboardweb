/**
 * 系统信息区域组件
 */

import { useTranslation } from "react-i18next";
import {
  Zap,
  Download,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Bot,
} from "lucide-react";
import type { DiagnosisResult } from "@/pages/dashboard/types";

interface SystemInfoSectionProps {
  nanobotPath: string | null;
  installingWithUv: boolean;
  installingWithPip: boolean;
  diagnosing: boolean;
  showDiagnosis: boolean;
  diagnosisResult: DiagnosisResult | null;
  onDownloadWithUv: () => void;
  onDownloadWithPip: () => void;
  onRunDiagnosis: () => void;
  onCloseDiagnosis: () => void;
}

export default function SystemInfoSection({
  nanobotPath,
  installingWithUv,
  installingWithPip,
  diagnosing,
  showDiagnosis,
  diagnosisResult,
  onDownloadWithUv,
  onDownloadWithPip,
  onRunDiagnosis,
  onCloseDiagnosis,
}: SystemInfoSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="p-6 bg-white dark:bg-dark-bg-card rounded-lg border border-gray-200 dark:border-dark-border-subtle transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-dark-text-primary">
          <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {t("dashboard.systemInfo")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {/* uv 下载按钮 */}
          <button
            onClick={onDownloadWithUv}
            disabled={installingWithUv || installingWithPip || diagnosing}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            {installingWithUv ? t("dashboard.installingWithUv") : t("dashboard.downloadWithUv")}
          </button>

          {/* pip 下载按钮 */}
          <button
            onClick={onDownloadWithPip}
            disabled={installingWithUv || installingWithPip || diagnosing}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            {installingWithPip ? t("dashboard.installingWithPip") : t("dashboard.downloadWithPip")}
          </button>

          {/* 环境诊断按钮 */}
          <button
            onClick={onRunDiagnosis}
            disabled={installingWithUv || installingWithPip || diagnosing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <Stethoscope className="w-4 h-4" />
            {diagnosing ? t("dashboard.diagnosing") : t("dashboard.diagnosis")}
          </button>
        </div>
      </div>

      {/* 诊断结果 */}
      {showDiagnosis && diagnosisResult && (
        <DiagnosisResultPanel
          diagnosisResult={diagnosisResult}
          onClose={onCloseDiagnosis}
        />
      )}

      <div className="space-y-3">
        {[
          { icon: FileText, label: t("dashboard.configFileLocation"), value: "~/.nanobot/config.json" },
          { icon: FileText, label: t("dashboard.workspaceLocation"), value: "~/.nanobot/workspace" },
          { icon: FileText, label: t("dashboard.logLocation"), value: "~/.nanobot/logs/nanobot.log" },
          { icon: Bot, label: t("dashboard.nanobotLocation"), value: nanobotPath || t("dashboard.notInstalled") },
        ].map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-dark-bg-sidebar border border-gray-100 dark:border-dark-border-subtle transition-colors duration-200"
          >
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <item.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-dark-text-muted">{item.label}</p>
              <p className="text-sm font-mono text-gray-700 dark:text-dark-text-secondary mt-0.5">{item.value}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagnosisResultPanel({
  diagnosisResult,
  onClose,
}: {
  diagnosisResult: DiagnosisResult;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 p-5 rounded-lg border bg-gray-50 dark:bg-dark-bg-sidebar border-gray-200 dark:border-dark-border-subtle transition-colors duration-200">
      <div className="flex items-center gap-2 mb-4">
        {diagnosisResult.overall === "passed" ? (
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        )}
        <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary">
          {t("dashboard.diagnosisResult")}: {diagnosisResult.overall === "passed" ? t("dashboard.passed") : t("dashboard.issuesFound")}
        </h3>
      </div>
      <div className="space-y-3">
        {diagnosisResult.checks.map((check, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded bg-white dark:bg-dark-bg-card border border-gray-200 dark:border-dark-border-subtle transition-colors duration-200">
            <div className="mt-0.5">
              {check.status === "ok" && <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />}
              {check.status === "warning" && <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              {check.status === "error" && <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{check.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  check.status === "ok" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                  check.status === "warning" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                  "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                }`}>
                  {check.status === "ok" ? t("dashboard.normal") : check.status === "warning" ? t("dashboard.warning") : t("dashboard.error")}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-dark-text-secondary mt-1">{check.message}</p>
              {check.details && (
                <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-dark-bg-hover p-2 rounded transition-colors duration-200">
                  {check.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="mt-4 text-sm text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary transition-colors duration-200"
      >
        {t("dashboard.closeDiagnosisResult")}
      </button>
    </div>
  );
}
