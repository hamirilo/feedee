"use client";

import * as React from "react";
import { ArticleData, InboxItemData } from "@/app/utils/api";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { ArticleReaderContent } from "./ArticleReaderContent";

export interface ArticleReaderSheetProps {
  selectedArticle: ArticleData | null;
  setSelectedArticle: (article: ArticleData | null) => void;
  inboxItems: InboxItemData[];
  somedayItems: InboxItemData[];
  handleSendArticleToInbox: (article: ArticleData) => void;
  openPromoteModalForArticle: (article: ArticleData) => void;
  toggleArticleFavorite: (article: ArticleData) => void;
  isMobile: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function ArticleReaderSheet({
  selectedArticle,
  setSelectedArticle,
  inboxItems,
  somedayItems,
  handleSendArticleToInbox,
  openPromoteModalForArticle,
  toggleArticleFavorite,
  isMobile,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: ArticleReaderSheetProps) {
  return (
    <Sheet
      open={!!selectedArticle && isMobile}
      onOpenChange={(open) => {
        if (!open) setSelectedArticle(null);
      }}
    >
      <SheetContent
        showCloseButton={false}
        className="w-full max-w-2xl sm:max-w-2xl h-full bg-white dark:bg-[#090e18] border-l border-gray-200 dark:border-gray-800 p-0 flex flex-col justify-between shadow-2xl"
      >
        {selectedArticle && (
          <ArticleReaderContent
            article={selectedArticle}
            inboxItems={inboxItems}
            somedayItems={somedayItems}
            handleSendArticleToInbox={handleSendArticleToInbox}
            openPromoteModalForArticle={openPromoteModalForArticle}
            toggleArticleFavorite={toggleArticleFavorite}
            onClose={() => setSelectedArticle(null)}
            onPrev={onPrev}
            onNext={onNext}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
