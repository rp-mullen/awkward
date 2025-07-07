export const questTemplate = {
    id: '',
    questName: '',
    description: '',
    isRepeatable: false,
    prerequisites: [],         // Array of quest IDs this quest depends on
    steps: [                   // Ordered steps
      {
        stepId: '',
        description: '',
        goalType: '',           // e.g., "Kill", "Collect", "TalkTo", "Explore"
        targetId: '',
        requiredCount: 1,
        isOptional: false
      }
    ],
    rewards: {
      experience: 0,
      gold: 0,
      items: []                // Array of item names or IDs
    },
    dialogueFile: '',
    tags: []
  };
  