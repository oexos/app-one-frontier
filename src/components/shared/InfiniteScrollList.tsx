import { useEffect, useRef } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import style from "./InfiniteScrollList.module.css";

interface InfiniteScrollListProps {
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isLoading: boolean;
  children: React.ReactNode;
}

const InfiniteScrollList: React.FC<InfiniteScrollListProps> = ({
  fetchNextPage,
  hasNextPage,
  isLoading,
  children,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoading) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isLoading]);

  return (
    <div>
      {children}
      <div ref={sentinelRef} className={style.sentinel}>
        {isLoading && <CircularProgress size={28} />}
      </div>
    </div>
  );
};

export default InfiniteScrollList;
