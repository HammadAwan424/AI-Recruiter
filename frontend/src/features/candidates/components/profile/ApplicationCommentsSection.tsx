import React from "react";
import { Box, Typography, Stack, Avatar } from "@mui/material";
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
    <Box className="p-5 rounded-2xl bg-black/40 border border-gray-800/80 shadow-lg mb-6">
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
        <MessageSquare size={20} className="text-[#05DC7F]" />
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
          Internal Team Comments ({comments.length})
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {comments.map((comment) => (
          <div key={comment.id} className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80 flex items-start gap-3">
            <Avatar className="w-7 h-7 bg-[#05DC7F]/20 text-[#05DC7F] text-xs font-bold border border-[#05DC7F]/40">
              {(comment.author_name || "User")[0].toUpperCase()}
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white font-bold text-xs">{comment.author_name || `User #${comment.author_id}`}</span>
                <span className="text-gray-500 text-[10px]">{comment.created_at}</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">{comment.content}</p>
            </div>
          </div>
        ))}
      </Stack>
    </Box>
  );
};
