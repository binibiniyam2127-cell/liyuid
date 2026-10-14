import React from "react";

export interface ChatBubbleProps {
  from: "me" | "them" | "system";
  author?: string;
  children: React.ReactNode;
}

export function ChatBubble({ from, author, children }: ChatBubbleProps) {
  if (from === "system") {
    return (
      <div className="w-full my-2 flex flex-col items-center text-center">
        <div className="bg-card border border-line px-3 py-1.5 rounded-full text-xs text-mute font-medium max-w-[90%]">
          {children}
        </div>
      </div>
    );
  }

  const isMe = from === "me";

  return (
    <div className={`flex flex-col gap-1 max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
      {author ? <span className="text-[12px] text-mute px-1 font-medium">{author}</span> : null}
      <div
        className={`px-3.5 py-2.5 rounded-2xl text-[14.5px] leading-relaxed break-words ${
          isMe ? "bg-brand text-card rounded-br-sm" : "bg-theirs text-ink rounded-bl-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}