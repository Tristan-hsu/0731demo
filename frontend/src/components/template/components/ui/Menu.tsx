"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Menu 組件的類型定義
export interface MenuItemData {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  danger?: boolean;
  children?: MenuItemData[];
  divider?: boolean;
}

interface MenuProps {
  items: MenuItemData[];
  className?: string;
  trigger?: React.ReactNode;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  autoClose?: boolean;
  optionsClassName?: string;
}

interface MenuItemProps extends Omit<MenuItemData, 'id'> {
  id: string;
  onClose?: () => void;
  level?: number;
}

// MenuItem 組件
export function MenuItem({
  id,
  label,
  icon,
  onClick,
  href,
  disabled = false,
  danger = false,
  children,
  onClose,
  level = 0
}: MenuItemProps) {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const hasChildren = children && children.length > 0;

  const handleClick = () => {
    if (disabled) return;

    if (hasChildren) {
      setIsSubMenuOpen(!isSubMenuOpen);
    } else {
      if (onClick) {
        onClick();
      }
      if (href) {
        window.location.href = href;
      }
      if (onClose) {
        onClose();
      }
    }
  };

  const itemClasses = `
    flex items-center w-full justify-between px-3 py-2 text-sm cursor-pointer transition-colors
    ${disabled
      ? 'text-muted-foreground cursor-not-allowed opacity-50'
      : danger
        ? 'text-destructive hover:bg-destructive/10 hover:text-destructive'
        : 'text-card-foreground hover:bg-accent hover:text-accent-foreground'
    }
    ${level > 0 ? 'pl-6' : ''}
  `;

  return (
    <>
      <div className={itemClasses} onClick={handleClick}>
        <div className="flex items-center gap-2">
          {icon && <span className="w-4 h-4">{icon}</span>}
          <span>{label}</span>
        </div>
        {hasChildren && (
          <ChevronRight
            className={`w-4 h-4 transition-transform ${isSubMenuOpen ? 'rotate-90' : ''}`}
          />
        )}
      </div>

      {hasChildren && isSubMenuOpen && (
        <div className="bg-muted/50">
          {children.map((child) => (
            <MenuItem
              key={child.id}
              {...child}
              onClose={onClose}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}

// MenuDivider 組件
export function MenuDivider() {
  return <div className="h-px bg-border my-1" />;
}

// 主 Menu 組件
export function Menu({
  items,
  className = '',
  trigger,
  placement = 'bottom-start',
  autoClose = true,
  optionsClassName = ''
}: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉菜單
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Calculate menu position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      setMenuPosition({
        top: rect.bottom + scrollTop,
        left: rect.left + scrollLeft,
        width: rect.width
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    if (autoClose) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative  inline-block ${className}`}>
      {/* Trigger */}
      {trigger && (
        <div
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer relative"
        >
          {trigger}
        </div>
      )}

      {/* Menu - Using React Portal for fixed positioning */}
      {isOpen && (
        <div
          ref={menuRef}
          className={cn("fixed z-[9999] bg-zinc-800 border border-border rounded-lg shadow-lg py-1 min-w-0", optionsClassName)}
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            width: `${menuPosition.width}px`,
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {item.divider && index > 0 && <MenuDivider />}
              <MenuItem {...item} onClose={handleClose} />
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// Context Menu 組件
interface ContextMenuProps {
  items: MenuItemData[];
  children: React.ReactNode;
  className?: string;
}

export function ContextMenu({ items, children, className = '' }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu} className={className}>
        {children}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-[9999] min-w-48 bg-popover border border-border rounded-lg shadow-lg py-1"
          style={{
            left: position.x,
            top: position.y
          }}
        >
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {item.divider && index > 0 && <MenuDivider />}
              <MenuItem {...item} onClose={handleClose} />
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
} 