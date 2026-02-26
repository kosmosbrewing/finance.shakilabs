export type Comment = {
  id: string;
  content: string;
  nickname: string;
  pageKey: string;
  createdAt: string;
  likeCount?: number;
  dislikeCount?: number;
};
