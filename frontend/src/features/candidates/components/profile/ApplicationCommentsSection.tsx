import React from "react";
import { MessageSquare } from "lucide-react";

interface ApplicationCommentsSectionProps {
  comments?: Array<{
    id: number;
    application_id: number;
    author_id: number;
    author_name?: string;
    content: string;
    created_at: string;
  }>;
}

export const ApplicationCommentsSection: React.FC<ApplicationCommentsSectionProps> = ({ comments }) => {
  if (!comments || comments.length === 0) return null;

  return (
    <div className="pb-6 border-b border-white/10 space-y-4">
      <div className="flex items-center gap-2 text-[#05DC7F]">
        <MessageSquare size={18} />
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Internal Team Comments ({comments.length})</h4>
      </div>

      <div className="space-y-2.5">
        {comments.map((comment) => (
          <div key={comment.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#05DC7F]/20 text-[#05DC7F] text-xs font-bold border border-[#05DC7F]/40 flex items-center justify-center shrink-0">
              {(comment.author_name || "U")[0].toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-white font-bold text-xs">{comment.author_name || `User #${comment.author_id}`}</span>
                <span className="text-white/40 text-[10px]">{comment.created_at}</span>
              </div>
              <p className="text-white/80 text-xs leading-relaxed">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicationCommentsSection;
