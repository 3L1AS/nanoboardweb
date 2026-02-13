/**
 * 配置概览卡片组件
 */

import { useTranslation } from "react-i18next";
import { Server, Bot, MessageSquare } from "lucide-react";
import type { Config } from "@/pages/dashboard/types";

interface ConfigOverviewCardsProps {
  config: Config | null;
}

export default function ConfigOverviewCards({ config }: ConfigOverviewCardsProps) {
  const { t } = useTranslation();

  if (!config) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* LLM 配置 */}
      <div className="p-5 bg-white dark:bg-dark-bg-card rounded-lg border border-gray-200 dark:border-dark-border-subtle card-hover transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-3">{t("dashboard.llmProvider")}</p>
        {(() => {
          const configuredProviders = config.providers
            ? Object.entries(config.providers).filter(
                ([_, p]) => p && p.apiKey && String(p.apiKey).trim() !== ""
              )
            : [];
          return configuredProviders.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {configuredProviders.map(([providerKey]) => (
                <div key={providerKey} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-dark-text-secondary">{providerKey}</span>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                    {t("dashboard.configured")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-dark-text-muted">{t("dashboard.noConfiguration")}</p>
          );
        })()}
      </div>

      {/* Agent 配置 */}
      <div className="p-5 bg-white dark:bg-dark-bg-card rounded-lg border border-gray-200 dark:border-dark-border-subtle card-hover transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
            <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-3">{t("dashboard.agentConfig")}</p>
        {config.agents?.defaults ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-dark-text-muted">{t("dashboard.model")}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-dark-text-secondary truncate max-w-[120px]" title={config.agents.defaults.model}>
                {config.agents.defaults.model || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-dark-text-muted">{t("dashboard.maxTokens")}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                {config.agents.defaults.max_tokens || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-dark-text-muted">{t("dashboard.maxToolIterations")}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                {config.agents.defaults.max_tool_iterations || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-dark-text-muted">{t("dashboard.temperature")}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                {config.agents.defaults.temperature || '-'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-dark-text-muted">{t("dashboard.noConfiguration")}</p>
        )}
      </div>

      {/* 消息渠道 */}
      <div className="p-5 bg-white dark:bg-dark-bg-card rounded-lg border border-gray-200 dark:border-dark-border-subtle card-hover transition-colors duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mb-3">{t("dashboard.messageChannels")}</p>
        {config.channels && Object.keys(config.channels).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(config.channels)
              .filter(([_, channel]: [string, any]) => channel?.enabled)
              .slice(0, 3)
              .map(([channelKey]) => (
                <div key={channelKey} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-dark-text-secondary capitalize">{channelKey}</span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                    {t("config.enabled")}
                  </span>
                </div>
              ))}
            {Object.values(config.channels).filter((c: any) => c?.enabled).length === 0 && (
              <p className="text-xs text-gray-500 dark:text-dark-text-muted">{t("dashboard.noEnabledChannels")}</p>
            )}
            {Object.values(config.channels).filter((c: any) => c?.enabled).length > 3 && (
              <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                {t("dashboard.totalChannels", { count: Object.values(config.channels).filter((c: any) => c?.enabled).length })}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-dark-text-muted">{t("dashboard.noConfiguration")}</p>
        )}
      </div>
    </div>
  );
}
