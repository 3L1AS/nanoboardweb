import { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 dark:bg-dark-bg-hover rounded-full flex items-center justify-center mb-4 transition-colors duration-200">
          <Icon className="w-8 h-8 text-gray-400 dark:text-dark-text-muted" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-2">{title || t("emptyState.title")}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-dark-text-muted mb-6 text-center max-w-md">{description || t("emptyState.description")}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
