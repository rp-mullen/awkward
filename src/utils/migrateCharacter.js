export const migrateCharacter = (oldCharacter, template) => {
    const migrated = { ...template };
  
    // Shallow fields
    Object.keys(template).forEach(key => {
      if (oldCharacter.hasOwnProperty(key)) {
        if (typeof template[key] === 'object' && !Array.isArray(template[key])) {
          migrated[key] = { ...template[key], ...oldCharacter[key] };  // merge objects like stats
        } else {
          migrated[key] = oldCharacter[key];
        }
      }
    });
  
    // Ensure factionAffiliations exists
    if (!Array.isArray(migrated.factionAffiliations)) {
      migrated.factionAffiliations = [];
    }
  
    return migrated;
  };
  