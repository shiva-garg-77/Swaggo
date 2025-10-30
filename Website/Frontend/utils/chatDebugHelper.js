/**
 * Chat Debug Helper
 * Helps debug chat creation issues
 */

export const debugChatCreation = (currentUser, targetUser, context = '') => {
  console.group(`🔍 CHAT DEBUG: ${context}`);
  
  console.log('Current User:', {
    id: currentUser?.id,
    profileid: currentUser?.profileid,
    username: currentUser?.username,
    allKeys: currentUser ? Object.keys(currentUser) : 'null'
  });
  
  console.log('Target User:', {
    id: targetUser?.id,
    profileid: targetUser?.profileid,
    username: targetUser?.username,
    allKeys: targetUser ? Object.keys(targetUser) : 'null'
  });
  
  const currentUserId = currentUser?.profileid || currentUser?.id;
  const targetUserId = targetUser?.profileid || targetUser?.id;
  
  console.log('Extracted IDs:', {
    currentUserId,
    targetUserId,
    areEqual: currentUserId === targetUserId,
    areBothValid: !!currentUserId && !!targetUserId
  });
  
  if (currentUserId === targetUserId) {
    console.error('❌ CRITICAL: Same user ID detected!');
    console.error('This will create an invalid chat with duplicate participants');
  }
  
  console.groupEnd();
  
  return {
    currentUserId,
    targetUserId,
    isValid: currentUserId !== targetUserId && !!currentUserId && !!targetUserId
  };
};

export const validateChatParticipants = (participants) => {
  console.group('🔍 VALIDATE PARTICIPANTS');
  
  console.log('Participants array:', participants);
  console.log('Length:', participants?.length);
  console.log('Unique count:', new Set(participants).size);
  
  if (!Array.isArray(participants)) {
    console.error('❌ Participants is not an array!');
    console.groupEnd();
    return false;
  }
  
  if (participants.length < 2) {
    console.error('❌ Less than 2 participants!');
    console.groupEnd();
    return false;
  }
  
  const uniqueParticipants = new Set(participants);
  if (uniqueParticipants.size < 2) {
    console.error('❌ Duplicate participants detected!');
    console.error('Unique participants:', Array.from(uniqueParticipants));
    console.groupEnd();
    return false;
  }
  
  console.log('✅ Participants valid');
  console.groupEnd();
  return true;
};
