"use client";

import { useRef, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface EditableTitleProps {
  title: string;
  sessionId: string;
  userId: string;
  onTitleUpdate?: (newTitle: string) => void;
  className?: string;
}

export default function EditableTitle({
  title,
  sessionId,
  userId,
  onTitleUpdate,
  className = "cursor-pointer text-lg font-medium text-white/80 hover:text-white/90",
}: EditableTitleProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditableTitle(title);
  }, [title]);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 0);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableTitle(e.target.value);
  };

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (editableTitle.trim() === "") {
      setEditableTitle(title);
      return;
    }

    if (editableTitle === title) {
      return;
    }

    try {
      const response = await fetch(`/api/chat`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          sessionId: sessionId,
          title: editableTitle,
        }),
      });

      const result = await response.json();

      if (result.code === 200) {
        onTitleUpdate?.(editableTitle);
      } else {
        toast.error("title_update_failed");
        setEditableTitle(title);
      }
    } catch (error) {
      console.error("更新标题时出错:", error);
      toast.error("title_update_failed");
      setEditableTitle(title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      titleInputRef.current?.blur();
    } else if (e.key === "Escape") {
      setEditableTitle(title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full pl-10 lg:pl-0">
      {isEditingTitle ? (
        <input
          ref={titleInputRef}
          type="text"
          value={editableTitle}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="w-full max-w-[500px] border-b border-white/30 bg-transparent px-0 py-0.5 text-lg font-medium text-white focus:border-white/60 focus:outline-hidden"
        />
      ) : (
        <h1 className={className} onClick={handleTitleClick}>
          {editableTitle}
        </h1>
      )}
    </div>
  );
}