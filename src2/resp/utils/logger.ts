import { MessagesGroup } from '../parser/MessagesGroupExtractor';

export const logMessage = (name: string, messagesGroup: MessagesGroup) => {
  if (messagesGroup.messages.length === 0) {
    return;
  }
  console.log(`===== ${name} =====`);
  for (const message of messagesGroup.messages) {
    const isCollection = 'items' in message;
    console.log(`${message.type} ${message.start}:${message.end}${isCollection ? `  (${message.size} items)` : ''}`);
  }
  console.log(`===== /${name} =====`);
};
