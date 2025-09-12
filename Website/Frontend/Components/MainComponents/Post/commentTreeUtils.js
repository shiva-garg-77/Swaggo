/**
 * Utility functions for building and managing threaded comment trees
 */

/**
 * Builds a threaded comment tree from a flat array of comments
 * @param {Array} comments - Flat array of comments from GraphQL
 * @returns {Array} - Tree structure with nested children
 */
export const buildCommentTree = (comments = []) => {
  const commentMap = new Map();
  const rootComments = [];

  // First pass: Create comment map with children arrays
  comments.forEach(comment => {
    commentMap.set(comment.commentid, {
      ...comment,
      children: [],
      depth: 0, // Will be calculated later
      totalReplies: 0 // Will be calculated later
    });
  });

  // Second pass: Build tree structure
  comments.forEach(comment => {
    const commentNode = commentMap.get(comment.commentid);
    
    if (comment.parentCommentId && commentMap.has(comment.parentCommentId)) {
      // This is a direct reply to another comment
      const parent = commentMap.get(comment.parentCommentId);
      parent.children.push(commentNode);
    } else if (comment.originalCommentId && commentMap.has(comment.originalCommentId) && !comment.parentCommentId) {
      // Legacy structure - treat as child of original comment
      const original = commentMap.get(comment.originalCommentId);
      original.children.push(commentNode);
    } else if (!comment.isReply && !comment.parentCommentId) {
      // This is a root comment
      rootComments.push(commentNode);
    }
  });

  // Third pass: Calculate depths and total reply counts
  const calculateMetrics = (commentList, currentDepth = 0) => {
    commentList.forEach(comment => {
      comment.depth = currentDepth;
      
      if (comment.children.length > 0) {
        // Calculate total replies (direct + nested)
        const countReplies = (node) => {
          let count = node.children.length;
          node.children.forEach(child => {
            count += countReplies(child);
          });
          return count;
        };
        
        comment.totalReplies = countReplies(comment);
        
        // Recursively process children
        calculateMetrics(comment.children, currentDepth + 1);
      }
    });
  };

  calculateMetrics(rootComments);

  // Sort comments by creation date
  const sortComments = (commentList) => {
    commentList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    commentList.forEach(comment => {
      if (comment.children.length > 0) {
        sortComments(comment.children);
      }
    });
  };

  sortComments(rootComments);
  return rootComments;
};

/**
 * Flattens a comment tree back to a flat array
 * @param {Array} commentTree - Tree structure
 * @returns {Array} - Flat array of comments
 */
export const flattenCommentTree = (commentTree) => {
  const flattened = [];
  
  const traverse = (comment) => {
    flattened.push(comment);
    if (comment.children) {
      comment.children.forEach(traverse);
    }
  };
  
  commentTree.forEach(traverse);
  return flattened;
};

/**
 * Gets all comment IDs from a tree structure
 * @param {Array} commentTree - Tree structure
 * @returns {Set} - Set of all comment IDs
 */
export const getAllCommentIds = (commentTree) => {
  const ids = new Set();
  
  const traverse = (comment) => {
    ids.add(comment.commentid);
    if (comment.children) {
      comment.children.forEach(traverse);
    }
  };
  
  commentTree.forEach(traverse);
  return ids;
};

/**
 * Finds a comment by ID in the tree
 * @param {Array} commentTree - Tree structure
 * @param {String} commentId - Comment ID to find
 * @returns {Object|null} - Found comment or null
 */
export const findCommentById = (commentTree, commentId) => {
  for (const comment of commentTree) {
    if (comment.commentid === commentId) {
      return comment;
    }
    
    if (comment.children.length > 0) {
      const found = findCommentById(comment.children, commentId);
      if (found) return found;
    }
  }
  
  return null;
};

/**
 * Gets the path to a comment (array of parent comments)
 * @param {Array} commentTree - Tree structure
 * @param {String} commentId - Target comment ID
 * @returns {Array} - Array of comments leading to the target
 */
export const getCommentPath = (commentTree, commentId) => {
  const findPath = (comments, targetId, currentPath = []) => {
    for (const comment of comments) {
      const newPath = [...currentPath, comment];
      
      if (comment.commentid === targetId) {
        return newPath;
      }
      
      if (comment.children.length > 0) {
        const found = findPath(comment.children, targetId, newPath);
        if (found) return found;
      }
    }
    
    return null;
  };
  
  return findPath(commentTree, commentId) || [];
};

/**
 * Calculates total comment count including all nested replies
 * @param {Array} commentTree - Tree structure
 * @returns {Number} - Total comment count
 */
export const getTotalCommentCount = (commentTree) => {
  let count = 0;
  
  const traverse = (comment) => {
    count++;
    if (comment.children) {
      comment.children.forEach(traverse);
    }
  };
  
  commentTree.forEach(traverse);
  return count;
};

/**
 * Gets comments at a specific depth level
 * @param {Array} commentTree - Tree structure
 * @param {Number} targetDepth - Target depth level
 * @returns {Array} - Comments at the specified depth
 */
export const getCommentsAtDepth = (commentTree, targetDepth) => {
  const commentsAtDepth = [];
  
  const traverse = (comment, currentDepth = 0) => {
    if (currentDepth === targetDepth) {
      commentsAtDepth.push(comment);
    }
    
    if (comment.children && currentDepth < targetDepth) {
      comment.children.forEach(child => traverse(child, currentDepth + 1));
    }
  };
  
  commentTree.forEach(comment => traverse(comment));
  return commentsAtDepth;
};

/**
 * Gets the maximum depth of the comment tree
 * @param {Array} commentTree - Tree structure
 * @returns {Number} - Maximum depth
 */
export const getMaxDepth = (commentTree) => {
  let maxDepth = 0;
  
  const traverse = (comment, currentDepth = 0) => {
    maxDepth = Math.max(maxDepth, currentDepth);
    
    if (comment.children) {
      comment.children.forEach(child => traverse(child, currentDepth + 1));
    }
  };
  
  commentTree.forEach(comment => traverse(comment));
  return maxDepth;
};

/**
 * Filters comments based on a predicate function
 * @param {Array} commentTree - Tree structure
 * @param {Function} predicate - Filter function
 * @param {Boolean} preserveStructure - Whether to preserve tree structure
 * @returns {Array} - Filtered comments
 */
export const filterComments = (commentTree, predicate, preserveStructure = true) => {
  if (!preserveStructure) {
    return flattenCommentTree(commentTree).filter(predicate);
  }
  
  const filterTree = (comments) => {
    return comments.reduce((acc, comment) => {
      const filteredChildren = comment.children ? filterTree(comment.children) : [];
      
      if (predicate(comment) || filteredChildren.length > 0) {
        acc.push({
          ...comment,
          children: filteredChildren
        });
      }
      
      return acc;
    }, []);
  };
  
  return filterTree(commentTree);
};

/**
 * Sorts comment tree by various criteria
 * @param {Array} commentTree - Tree structure
 * @param {String} sortBy - Sort criteria ('date', 'likes', 'replies')
 * @param {String} order - Sort order ('asc', 'desc')
 * @returns {Array} - Sorted comment tree
 */
export const sortCommentTree = (commentTree, sortBy = 'date', order = 'asc') => {
  const getSortValue = (comment) => {
    switch (sortBy) {
      case 'date':
        return new Date(comment.createdAt);
      case 'likes':
        return comment.likeCount || 0;
      case 'replies':
        return comment.totalReplies || 0;
      default:
        return new Date(comment.createdAt);
    }
  };
  
  const sortComments = (comments) => {
    const sorted = [...comments].sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);
      
      if (order === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
    
    // Recursively sort children
    return sorted.map(comment => ({
      ...comment,
      children: comment.children ? sortComments(comment.children) : []
    }));
  };
  
  return sortComments(commentTree);
};

/**
 * Transforms comment tree for display with custom formatting
 * @param {Array} commentTree - Tree structure
 * @param {Function} transformer - Transform function for each comment
 * @returns {Array} - Transformed comment tree
 */
export const transformCommentTree = (commentTree, transformer) => {
  const transform = (comments) => {
    return comments.map(comment => {
      const transformed = transformer(comment);
      
      return {
        ...transformed,
        children: comment.children ? transform(comment.children) : []
      };
    });
  };
  
  return transform(commentTree);
};

/**
 * Validates comment tree structure
 * @param {Array} commentTree - Tree structure to validate
 * @returns {Object} - Validation result with errors
 */
export const validateCommentTree = (commentTree) => {
  const errors = [];
  const seenIds = new Set();
  
  const validate = (comments, depth = 0) => {
    comments.forEach((comment, index) => {
      // Check for required fields
      if (!comment.commentid) {
        errors.push(`Comment at depth ${depth}, index ${index} missing commentid`);
      }
      
      // Check for duplicate IDs
      if (seenIds.has(comment.commentid)) {
        errors.push(`Duplicate comment ID: ${comment.commentid}`);
      } else {
        seenIds.add(comment.commentid);
      }
      
      // Check children array
      if (comment.children && !Array.isArray(comment.children)) {
        errors.push(`Comment ${comment.commentid} children is not an array`);
      }
      
      // Recursively validate children
      if (comment.children) {
        validate(comment.children, depth + 1);
      }
    });
  };
  
  validate(commentTree);
  
  return {
    isValid: errors.length === 0,
    errors,
    totalComments: seenIds.size
  };
};

/**
 * Creates a comment tree statistics object
 * @param {Array} commentTree - Tree structure
 * @returns {Object} - Statistics about the comment tree
 */
export const getCommentTreeStats = (commentTree) => {
  let totalComments = 0;
  let totalLikes = 0;
  let maxDepth = 0;
  let threadCount = commentTree.length;
  const depthDistribution = {};
  
  const analyze = (comments, currentDepth = 0) => {
    maxDepth = Math.max(maxDepth, currentDepth);
    
    comments.forEach(comment => {
      totalComments++;
      totalLikes += comment.likeCount || 0;
      
      // Track depth distribution
      if (!depthDistribution[currentDepth]) {
        depthDistribution[currentDepth] = 0;
      }
      depthDistribution[currentDepth]++;
      
      if (comment.children) {
        analyze(comment.children, currentDepth + 1);
      }
    });
  };
  
  analyze(commentTree);
  
  return {
    totalComments,
    totalLikes,
    threadCount,
    maxDepth,
    depthDistribution,
    avgLikesPerComment: totalComments > 0 ? (totalLikes / totalComments).toFixed(2) : 0
  };
};
