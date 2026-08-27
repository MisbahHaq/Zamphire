import { createContext, useContext } from 'react';
import { useData } from './DataContext';
import * as store from '../store';

const BookmarkContext = createContext(null);

export function BookmarkProvider({ children }) {
  const { bookmarkIds, products, toggleBookmark } = useData();
  const value = {
    count: bookmarkIds.length,
    ids: bookmarkIds,
    has: (id) => store.hasBookmark(bookmarkIds, id),
    toggle: (id) => toggleBookmark(id),
    products: () => store.bookmarkProducts(bookmarkIds, products)
  };
  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  return useContext(BookmarkContext);
}
