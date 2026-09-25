import '../styles/design-system.css'
import { Activity, Monitor, HardDrive, Server, Code, Zap, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  accentColor?: string
}

export const MetricCard = ({ label, value, icon, accentColor }: MetricCardProps) => {
  // Default icon mappings based on label
  const getIconForLabel = (label: string): LucideIcon => {
    switch (label) {
      case 'CPU Usage': return Activity;
      case 'Memory Usage': return Monitor;
      case 'Disk Usage': return HardDrive;
      case 'Hostname': return Server;
      case 'Platform': return Code;
      case 'Boot Time': return Zap;
      default: return Activity;
    }
  };

  // Default accent colors based on label
  const getAccentColorForLabel = (label: string): string => {
    switch (label) {
      case 'CPU Usage': return '#10B981';
      case 'Memory Usage': return '#8B5CF6';
      case 'Disk Usage': return '#F59E0B';
      case 'Hostname': return '#10B981';
      case 'Platform': return '#6366F1';
      case 'Boot Time': return '#94A3B8';
      default: return 'var(--text-secondary)';
    }
  };

  const IconComponent = icon || getIconForLabel(label);
  const AccentColor = accentColor || getAccentColorForLabel(label);

  return (
    <div className="metric-card-compact">
      <div className="flex items-center gap-3">
        <IconComponent
          size={16}
          color={AccentColor}
          className="flex-shrink-0"
        />
        <div>
          <p className="metric-label-compact">{label.toUpperCase()}</p>
          <p className="metric-value-compact">{value}</p>
        </div>
      </div>
    </div>
  )
}
