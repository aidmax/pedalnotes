import { ReactNode, useRef } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon?: ReactNode;
  hasData?: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function CollapsibleSection({
  id,
  title,
  icon,
  hasData = false,
  isOpen,
  onOpenChange,
  children,
}: CollapsibleSectionProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function handleToggle() {
    if (detailsRef.current) {
      onOpenChange(detailsRef.current.open);
    }
  }

  return (
    <details
      ref={detailsRef}
      id={id}
      open={isOpen}
      onToggle={handleToggle}
    >
      <summary className="flex items-center justify-between cursor-pointer list-none text-md font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {icon}
          {title}
          {hasData && !isOpen && (
            <span
              className="w-2 h-2 rounded-full bg-blue-500"
              aria-label="Section contains data"
            />
          )}
        </span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </summary>
      <div className="pt-4 space-y-4">
        {children}
      </div>
    </details>
  );
}
