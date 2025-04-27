// utils/groupTransactionsByDate.js
import { format } from 'date-fns';

export const formatDateForHeader = dateStr => {
  const today = new Date();
  const date = new Date(dateStr);

  const isToday = date.toDateString() === today.toDateString();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return format(date, 'dd/MM/yyyy');
};

export const groupTransactionsByDate = transactions => {
  // Normalize to YYYY-MM-DD
  const normalizeDate = date => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const grouped = transactions.reduce((acc, txn) => {
    const dateKey = normalizeDate(txn.date);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(txn);
    return acc;
  }, {});

  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  });

  const sectionData = Object.keys(grouped)
    .sort((a, b) => new Date(a) - new Date(b))
    .map(dateStr => ({
      title: formatDateForHeader(dateStr),
      rawDate: dateStr,
      data: grouped[dateStr].reverse(), // oldest first
    }));

  return sectionData;
};
