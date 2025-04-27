import AsyncStorage from '@react-native-async-storage/async-storage';

export const addToOfflineQueue = async (queueName, data) => {
  try {
    const existing = await AsyncStorage.getItem(queueName);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push(data);
    await AsyncStorage.setItem(queueName, JSON.stringify(queue));
    console.log(`Added to ${queueName}`, data);
  } catch (err) {
    console.log(`Error adding to ${queueName}`, err);
  }
};

export const getOfflineQueue = async (queueName) => {
  try {
    const queue = await AsyncStorage.getItem(queueName);
    return queue ? JSON.parse(queue) : [];
  } catch (err) {
    console.log(`Error getting ${queueName}`, err);
    return [];
  }
};

export const clearOfflineQueue = async (queueName) => {
  try {
    await AsyncStorage.removeItem(queueName);
    console.log(`Cleared ${queueName}`);
  } catch (err) {
    console.log(`Error clearing ${queueName}`, err);
  }
};

export const processOfflineQueue = async (queueName, processFunction) => {
  const queue = await getOfflineQueue(queueName);
  if (!queue.length) return;

  for (const item of queue) {
    try {
      await processFunction(item);
    } catch (err) {
      console.log(`Failed to process ${queueName} item`, item, err);
    }
  }
  await clearOfflineQueue(queueName);
};
