"use client";

import { useUserContent } from "@/lib/context/user-content-context";
import ContentRow from "./ContentRow";

export default function MyListRow() {
  const { myList } = useUserContent();

  if (!myList || myList.length === 0) {
    return null;
  }

  const items = myList.map((m) => m.content);

  return (
    <ContentRow
      title="My List"
      subtitle="Saved to your personal watch queue"
      items={items}
    />
  );
}
