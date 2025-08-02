"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import {
  FileText,
  Building,
  User,
  LogIn,
  LogOut,
  Bot,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLensChat } from "@/store/useLensChat";
import { usePathname, useRouter } from "next/navigation";
import { FiTrash2 } from "react-icons/fi";
import { BsThreeDotsVertical } from "react-icons/bs";
import Image from "next/image";
import { RiSidebarFoldLine } from "react-icons/ri";
import { HiMiniArrowLeftOnRectangle, HiMiniArrowRightOnRectangle } from "react-icons/hi2";

interface SideBarProps {
  className?: string;
}

export default function PersonalSideBar({ className }: SideBarProps) {
  const router = useRouter();
  const url = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAILawyerExpanded, setIsAILawyerExpanded] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [currentChatId, setCurrentChatId] = useState("");
  const { data: session, status } = useSession();
  const { isLoading: isLoadingHistory, lensChatHistories, fetchAllLensChatHistory, deleteLensChatHistory } =
    useLensChat();
  useEffect(() => {
    if (session?.user?.id) {
      fetchAllLensChatHistory(session.user.id);
    }
  }, [session?.user?.id, fetchAllLensChatHistory]);


  const menuItems = [
    {
      icon: Bot,
      label: "AI Counsel",
      href: "/legal-agent",
    },
  ];

  const toggleSidebar = () => {
    setIsTransitioning(true);
    setIsCollapsed(!isCollapsed);
    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300); // Match the CSS transition duration
  };

  const handleDeleteChat = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // 阻止事件冒泡
    if (session?.user?.id) {
      deleteLensChatHistory(session.user.id, sessionId);
      // 删除后刷新聊天历史
      setTimeout(() => {
        fetchAllLensChatHistory(session?.user?.id || "");
      }, 300);
      // 如果正在查看被删除的聊天，则重定向到主页
      if (sessionId === url.split("/").pop()) {
        router.push(`/self-firm/legal-agent`);
      }
    }
  };

  return (
    <>
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="fixed left-4 top-4 z-30 flex w-fit items-center justify-center rounded-md text-secondary-foreground/60 transition-all duration-300 hover:bg-muted/20 hover:text-secondary-foreground lg:hidden"
      >
        <RiSidebarFoldLine size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "relative z-200 hidden lg:flex overflow-hidden h-screen flex-col border-r border-sidebar-border bg-secondary transition-all duration-300",
          isCollapsed
            ? "w-[50px] items-center overflow-hidden"
            : "w-[260px]",
          className
        )}
      >
        {showMenu && (
          <div
            className="fixed z-1002 w-28 rounded-md border border-sidebar-border bg-secondary shadow-lg backdrop-blur-xs transition-all duration-300"
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs text-secondary-foreground/80 hover:bg-muted/20"
              onClick={(e) => {
                handleDeleteChat(e, currentChatId);
                setShowMenu(false);
              }}
            >
              <FiTrash2 size={14} />
              <span>刪除</span>
            </div>
          </div>
        )}

        {/* Header with Logo and Toggle */}
        <div className="flex items-center gap-4 px-3 py-4">
          <button
            onClick={toggleSidebar}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            className="z-30 flex w-fit items-center justify-center rounded-md p-1 text-secondary-foreground/60 transition-all duration-300 hover:bg-muted/20 hover:text-secondary-foreground"
            title={isCollapsed ? "展開側邊欄" : "收縮側邊欄"}
            disabled={isTransitioning}
          >
            {!isHover ? (
              <RiSidebarFoldLine size={20} />
            ) : isCollapsed ? (
              <HiMiniArrowRightOnRectangle size={20} />
            ) : (
              <HiMiniArrowLeftOnRectangle size={20} />
            )}

          </button>

          {!isCollapsed && (
            <Link href="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
              {/* <Scale className="h-6 w-6 text-primary" /> */}
              <Image src="/logo.svg" alt="Legal Lens" width={32} height={32} className="w-6 h-6" />
              <span className="text-nowrap font-serif text-lg font-bold uppercase text-secondary-foreground">
                Legal Lens
              </span>
            </Link>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-4 space-y-2">
          {isCollapsed ? (
            <div className="flex flex-col gap-4">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_0_10px_rgba(139,69,19,0.3)] transition-all duration-300"
                  title={item.label}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {menuItems.map((item, index) => {
                if (item.label === "AI Counsel") {
                  return (
                    <div key={index} className="space-y-1">
                      <div
                        className="flex w-full items-center justify-between space-x-3 p-3 rounded-lg hover:bg-muted/20 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-5 w-5 text-secondary-foreground/60" />
                          <span className="text-nowrap text-secondary-foreground font-medium">
                            {item.label}
                          </span>
                        </div>
                      </div>
                      <div className="ml-8 custom-scrollbar h-[calc(100vh-270px)] space-y-3 overflow-y-auto overflow-x-hidden">
                        <div
                          className="flex cursor-pointer items-center justify-between rounded-md border border-primary/50 bg-linear-to-r from-black/80 to-primary/10 p-3 transition-all duration-300 hover:border-primary hover:from-primary/5 hover:to-primary/20 hover:shadow-[0_0_10px_rgba(90,90,255,0.3)]"
                          onClick={() => router.push(`/legal-agent`)}
                        >
                          <div className="flex items-center">
                            <span className="text-nowrap font-basis-mono text-sm font-medium tracking-wide text-primary">
                              新增聊天
                            </span>
                          </div>
                          <div className="text-xs text-primary/70">+</div>
                        </div>
                        {isLoadingHistory ? (
                          <div className="text-sm text-secondary-foreground/60 p-2 flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                            <span>載入聊天歷史中...</span>
                          </div>
                        ) : lensChatHistories.filter(chat => !chat.user_case_id).length > 0 ? (
                          lensChatHistories.filter(chat => !chat.user_case_id).map((chat) => (
                            <div onClick={() => {
                              router.push(`/legal-agent/p/${chat.sessionId}`);
                            }}
                              key={chat.sessionId}
                              className="flex items-center cursor-pointer justify-between p-2 rounded-md hover:bg-muted/20 transition-colors group"
                              title={chat.title}
                            >
                              <div className="flex flex-col">
                                <span className="max-w-[180px] truncate text-nowrap text-xs text-white/80">
                                  {chat.title === ""
                                    ? chat.messages[0].content.length > 25
                                      ? chat.messages[0].content.substring(0, 25) +
                                      "..."
                                      : chat.messages[0].content
                                    : chat.title}
                                </span>
                                <div className="text-xs text-secondary-foreground/60 mt-1">
                                  {new Date(chat.updatedAt || new Date()).toLocaleDateString('zh-TW', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <div className="relative ml-auto hidden group-hover:block">
                                <div
                                  className="three-dots-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // 获取点击元素的位置信息
                                    const rect = (
                                      e.currentTarget as HTMLElement
                                    ).getBoundingClientRect();
                                    setMenuPosition({
                                      top: rect.bottom + 5,
                                      right: window.innerWidth - rect.right - 100,
                                    });
                                    setCurrentChatId(chat.sessionId);
                                    setShowMenu(!showMenu);
                                  }}
                                >
                                  <BsThreeDotsVertical
                                    size={16}
                                    className="cursor-pointer text-secondary-foreground/60 hover:text-secondary-foreground"
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-secondary-foreground/60 p-2">
                            尚無聊天記錄
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={index}
                    href={item.href}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/20 transition-colors duration-200"
                  >
                    <item.icon className="h-5 w-5 text-secondary-foreground/60" />
                    <span className="text-nowrap text-secondary-foreground font-medium">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* User Profile / Login Section */}
        <div className="mt-auto px-3 py-4">
          {status === "loading" ? (
            <div className="flex items-center justify-center p-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : session?.user ? (
            <div className="space-y-2">
              {/* User Profile */}
              {isCollapsed ? (
                <div className="flex aspect-square size-7 cursor-pointer items-center justify-center rounded-full">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "用戶頭像"}
                      className="w-full rounded-full border border-gray-300 dark:border-white/80"
                      title={session.user.name || "用戶"}
                    />
                  ) : (
                    <User className="size-6 text-secondary-foreground/60" />
                  )}
                </div>
              ) : (
                <div className="flex w-full cursor-pointer items-center gap-4 rounded-md p-2 hover:bg-muted/20 transition-all duration-300">
                  <div className="flex aspect-square size-7 cursor-pointer items-center justify-center rounded-full">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "用戶頭像"}
                        className="w-full rounded-full border border-gray-300 dark:border-white/80"
                      />
                    ) : (
                      <User className="size-6 text-secondary-foreground/60" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-nowrap">
                    <span className="text-sm font-medium text-secondary-foreground truncate">
                      {session.user.name || "用戶"}
                    </span>
                    <span className="text-xs text-secondary-foreground/60 truncate">
                      {session.user.email}
                    </span>
                  </div>
                </div>
              )}

              {/* Logout Button */}
              {isCollapsed ? (
                <button
                  onClick={() => signOut()}
                  className="flex size-7 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-300"
                  title="登出"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-4 w-full p-2 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-secondary-foreground"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-nowrap font-medium">登出</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {isCollapsed ? (
                <button
                  onClick={() => signIn()}
                  className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300"
                  title="登入"
                >
                  <LogIn className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="flex items-center gap-4 w-full p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-colors text-secondary-foreground"
                >
                  <LogIn className="h-5 w-5" />
                  <span className="text-nowrap font-medium">登入</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col gap-4 overflow-visible border-r border-sidebar-border bg-secondary px-3 py-4 shadow-xl transition-all duration-300 lg:hidden",
          isMobileSidebarOpen ? "w-[280px] translate-x-0" : "-translate-x-full",
        )}
      >
        {showMenu && (
          <div
            className="fixed z-1002 w-28 rounded-md border border-sidebar-border bg-secondary shadow-lg backdrop-blur-xs transition-all duration-300"
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs text-secondary-foreground/80 hover:bg-muted/20"
              onClick={(e) => {
                handleDeleteChat(e, currentChatId);
                setShowMenu(false);
              }}
            >
              <FiTrash2 size={14} />
              <span>刪除</span>
            </div>
          </div>
        )}

        {/* Mobile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="z-30 flex w-fit items-center justify-center rounded-md p-1 text-secondary-foreground/60 transition-all duration-300 hover:bg-muted/20 hover:text-secondary-foreground"
            >
              <HiMiniArrowLeftOnRectangle size={20} />
            </button>
            <Link href="/" className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <Image src="/logo.svg" alt="Legal Lens" width={32} height={32} className="w-6 h-6" />
              <span className="text-nowrap font-serif text-lg font-bold uppercase text-secondary-foreground">
                Legal Lens
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Items */}
        <nav className="flex-1 space-y-2">
          <div className="space-y-2">
            {menuItems.map((item, index) => {
              if (item.label === "AI Counsel") {
                return (
                  <div key={index} className="space-y-1">
                    <button
                      onClick={() => setIsAILawyerExpanded(!isAILawyerExpanded)}
                      className="flex w-full items-center justify-between space-x-3 p-3 rounded-lg hover:bg-muted/20 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5 text-secondary-foreground/60" />
                        <span className="text-nowrap text-secondary-foreground font-medium">
                          {item.label}
                        </span>
                      </div>
                      {isAILawyerExpanded ? (
                        <ChevronUp className="h-4 w-4 text-secondary-foreground/60" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-secondary-foreground/60" />
                      )}
                    </button>

                    {isAILawyerExpanded && (
                      <div className="ml-8 space-y-1 max-h-60 overflow-y-auto">
                        <Link
                          href={`/self-firm/legal-agent/`}
                          className="block p-2 bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/20 transition-colors group"
                          title={`新增聊天`}
                          onClick={() => setIsMobileSidebarOpen(false)}
                        >
                          <div className="text-sm text-secondary-foreground/80 font-medium truncate group-hover:text-secondary-foreground">
                            新增聊天
                          </div>
                        </Link>
                        {isLoadingHistory ? (
                          <div className="text-sm text-secondary-foreground/60 p-2 flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                            <span>載入聊天歷史中...</span>
                          </div>
                        ) : lensChatHistories.filter(chat => !chat.user_case_id).length > 0 ? (
                          lensChatHistories.filter(chat => !chat.user_case_id).map((chat) => (
                            <div onClick={() => {
                              router.push(`/self-firm/legal-agent/p/${chat.sessionId}`);
                              setIsMobileSidebarOpen(false);
                            }}
                              key={chat.sessionId}
                              className="flex items-center justify-between p-2 rounded-md hover:bg-muted/20 transition-colors group"
                              title={chat.title}
                            >
                              <div>
                                <div className="text-sm text-secondary-foreground/80 font-medium truncate group-hover:text-secondary-foreground">
                                  {chat.title}
                                </div>
                                <div className="text-xs text-secondary-foreground/60 mt-1">
                                  {new Date(chat.updatedAt || new Date()).toLocaleDateString('zh-TW', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <div className="relative ml-auto hidden group-hover:block">
                                <div
                                  className="three-dots-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = (
                                      e.currentTarget as HTMLElement
                                    ).getBoundingClientRect();
                                    setMenuPosition({
                                      top: rect.bottom + 5,
                                      right: window.innerWidth - rect.right - 100,
                                    });
                                    setCurrentChatId(chat.sessionId);
                                    setShowMenu(!showMenu);
                                  }}
                                >
                                  <BsThreeDotsVertical
                                    size={16}
                                    className="cursor-pointer text-secondary-foreground/60 hover:text-secondary-foreground"
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-secondary-foreground/60 p-2">
                            尚無聊天記錄
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/20 transition-colors duration-200"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5 text-secondary-foreground/60" />
                  <span className="text-nowrap text-secondary-foreground font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile User Profile / Login Section */}
        <div className="mt-auto space-y-2">
          {status === "loading" ? (
            <div className="flex items-center justify-center p-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : session?.user ? (
            <div className="space-y-2">
              {/* User Profile */}
              <div className="flex w-full cursor-pointer items-center gap-4 rounded-md p-2 hover:bg-muted/20 transition-all duration-300">
                <div className="flex aspect-square size-7 cursor-pointer items-center justify-center rounded-full">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "用戶頭像"}
                      className="w-full rounded-full border border-gray-300 dark:border-white/80"
                    />
                  ) : (
                    <User className="size-6 text-secondary-foreground/60" />
                  )}
                </div>
                <div className="flex flex-col gap-1 text-nowrap">
                  <span className="text-sm font-medium text-secondary-foreground truncate">
                    {session.user.name || "用戶"}
                  </span>
                  <span className="text-xs text-secondary-foreground/60 truncate">
                    {session.user.email}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  signOut();
                  setIsMobileSidebarOpen(false);
                }}
                className="flex items-center gap-4 w-full p-2 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-secondary-foreground"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-nowrap font-medium">登出</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => {
                  signIn();
                  setIsMobileSidebarOpen(false);
                }}
                className="flex items-center gap-4 w-full p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-colors text-secondary-foreground"
              >
                <LogIn className="h-5 w-5" />
                <span className="text-nowrap font-medium">登入</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}