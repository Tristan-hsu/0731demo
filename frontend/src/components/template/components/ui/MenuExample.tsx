"use client";

import React from 'react';
import { Menu, ContextMenu, MenuItemData } from './Menu';
import {
  User,
  Settings,
  LogOut,
  Edit,
  Trash2,
  Copy,
  Download,
  MoreVertical,
  ChevronDown
} from 'lucide-react';

export function MenuExample() {
  // 下拉菜單示例數據
  const dropdownMenuItems: MenuItemData[] = [
    {
      id: 'profile',
      label: '個人資料',
      icon: <User />,
      onClick: () => console.log('打開個人資料')
    },
    {
      id: 'settings',
      label: '設定',
      icon: <Settings />,
      children: [
        {
          id: 'account',
          label: '帳戶設定',
          onClick: () => console.log('帳戶設定')
        },
        {
          id: 'privacy',
          label: '隱私設定',
          onClick: () => console.log('隱私設定')
        },
        {
          id: 'notifications',
          label: '通知設定',
          onClick: () => console.log('通知設定')
        }
      ]
    },
    {
      id: 'divider1',
      label: '',
      divider: true
    },
    {
      id: 'logout',
      label: '登出',
      icon: <LogOut />,
      danger: true,
      onClick: () => console.log('登出')
    }
  ];

  // 操作菜單示例數據
  const actionMenuItems: MenuItemData[] = [
    {
      id: 'edit',
      label: '編輯',
      icon: <Edit />,
      onClick: () => console.log('編輯項目')
    },
    {
      id: 'copy',
      label: '複製',
      icon: <Copy />,
      onClick: () => console.log('複製項目')
    },
    {
      id: 'download',
      label: '下載',
      icon: <Download />,
      onClick: () => console.log('下載項目')
    },
    {
      id: 'divider1',
      label: '',
      divider: true
    },
    {
      id: 'delete',
      label: '刪除',
      icon: <Trash2 />,
      danger: true,
      onClick: () => console.log('刪除項目')
    }
  ];

  // 右鍵菜單示例數據
  const contextMenuItems: MenuItemData[] = [
    {
      id: 'copy',
      label: '複製',
      icon: <Copy />,
      onClick: () => console.log('複製內容')
    },
    {
      id: 'edit',
      label: '編輯',
      icon: <Edit />,
      onClick: () => console.log('編輯內容')
    },
    {
      id: 'divider1',
      label: '',
      divider: true
    },
    {
      id: 'delete',
      label: '刪除',
      icon: <Trash2 />,
      danger: true,
      onClick: () => console.log('刪除內容')
    }
  ];

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Menu 組件示例</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 下拉菜單示例 */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">下拉菜單</h2>
            <p className="text-muted-foreground mb-4">點擊按鈕打開菜單</p>

            <Menu
              items={dropdownMenuItems}
              trigger={
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  用戶菜單
                  <ChevronDown className="w-4 h-4" />
                </button>
              }
              placement="bottom-start"
            />
          </div>

          {/* 操作菜單示例 */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">操作菜單</h2>
            <p className="text-muted-foreground mb-4">更多操作選項</p>

            <Menu
              items={actionMenuItems}
              trigger={
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </button>
              }
              placement="bottom-end"
            />
          </div>

          {/* 右鍵菜單示例 */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">右鍵菜單</h2>
            <p className="text-muted-foreground mb-4">在下方區域右鍵點擊</p>

            <ContextMenu items={contextMenuItems}>
              <div className="w-full h-32 bg-muted/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/70 transition-colors">
                右鍵點擊這裡
              </div>
            </ContextMenu>
          </div>

          {/* 顏色主題示例 */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">顏色主題</h2>
            <p className="text-muted-foreground mb-4">使用 globals.css 的顏色變量</p>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-background text-foreground rounded">background</div>
              <div className="p-2 bg-card text-card-foreground rounded">card</div>
              <div className="p-2 bg-primary text-primary-foreground rounded">primary</div>
              <div className="p-2 bg-secondary text-secondary-foreground rounded">secondary</div>
              <div className="p-2 bg-muted text-muted-foreground rounded">muted</div>
              <div className="p-2 bg-accent text-accent-foreground rounded">accent</div>
            </div>
          </div>
        </div>

        {/* 使用說明 */}
        <div className="mt-8 bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">使用說明</h2>
          <div className="space-y-3 text-muted-foreground">
            <p><strong className="text-card-foreground">基本菜單：</strong>使用 Menu 組件創建下拉菜單</p>
            <p><strong className="text-card-foreground">右鍵菜單：</strong>使用 ContextMenu 組件創建上下文菜單</p>
            <p><strong className="text-card-foreground">子菜單：</strong>在 children 屬性中添加子項目</p>
            <p><strong className="text-card-foreground">危險操作：</strong>設置 danger: true 顯示為紅色</p>
            <p><strong className="text-card-foreground">分隔線：</strong>設置 divider: true 添加分隔線</p>
            <p><strong className="text-card-foreground">禁用項目：</strong>設置 disabled: true 禁用菜單項</p>
          </div>
        </div>
      </div>
    </div>
  );
} 