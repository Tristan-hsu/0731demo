"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, ChevronRight, Scale, FileText, Briefcase, ListChecks } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Panel {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface MobilePanelSelectorProps {
  panels: Panel[];
  defaultPanel?: string;
  className?: string;
  onClose?: () => void;
}

export function MobilePanelSelector({
  panels,
  defaultPanel,
  className,
  onClose,
}: MobilePanelSelectorProps) {
  const [selectedPanel, setSelectedPanel] = useState<string | null>(defaultPanel || null);
  const [isOpen, setIsOpen] = useState(false);

  // Auto open when there's content
  useEffect(() => {
    if (panels.length > 0 && !isOpen) {
      setIsOpen(true);
    }
  }, [panels.length]);

  const handlePanelSelect = (panelId: string) => {
    setSelectedPanel(panelId);
  };

  const handleClose = () => {
    setSelectedPanel(null);
    setIsOpen(false);
    onClose?.();
  };

  const selectedPanelData = panels.find(panel => panel.id === selectedPanel);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Bottom Sheet Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl",
              "max-h-[85vh] overflow-hidden",
              className
            )}
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-muted-foreground/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold">
                {selectedPanelData ? selectedPanelData.label : "選擇內容"}
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 100px)" }}>
              {!selectedPanel ? (
                /* Panel List */
                <div className="p-4 space-y-2">
                  {panels.map((panel) => (
                    <button
                      key={panel.id}
                      onClick={() => !panel.disabled && handlePanelSelect(panel.id)}
                      disabled={panel.disabled}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-lg",
                        "bg-muted/50 hover:bg-muted transition-colors",
                        "text-left group",
                        panel.disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background">
                          {panel.icon}
                        </div>
                        <div>
                          <p className="font-medium">{panel.label}</p>
                          {panel.disabled && (
                            <p className="text-sm text-muted-foreground">即將推出</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 text-muted-foreground",
                        "group-hover:translate-x-1 transition-transform",
                        panel.disabled && "opacity-50"
                      )} />
                    </button>
                  ))}
                </div>
              ) : (
                /* Selected Panel Content */
                <div className="relative">
                  {/* Back Button */}
                  <button
                    onClick={() => setSelectedPanel(null)}
                    className="sticky top-0 z-10 w-full p-3 bg-background/95 backdrop-blur-sm border-b flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    返回選單
                  </button>
                  
                  {/* Panel Content */}
                  <div className="p-4">
                    {selectedPanelData?.content}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper function to get icon for panel
export function getPanelIcon(panelId: string): React.ReactNode {
  switch (panelId) {
    case "answer":
      return <Image src="/logo.svg" alt="回答" width={20} height={20} />;
    case "laws":
      return <FileText className="w-5 h-5 text-primary" />;
    case "cases":
      return <Briefcase className="w-5 h-5 text-primary" />;
    case "steps":
      return <ListChecks className="w-5 h-5 text-primary" />;
    default:
      return <Scale className="w-5 h-5 text-primary" />;
  }
}