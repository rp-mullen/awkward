import { useState, useEffect } from 'react';
import {
  Paper, Typography, Stack, TextField, Grid, Button,
  FormControl, InputLabel, Select, MenuItem, Chip, Box, IconButton, Autocomplete
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { characterTemplate } from '../dataModels/characterTemplate';
import { downloadJson } from '../utils/downloadJson';
import { db } from '../firebase';
import { ref, onValue, set, get, runTransaction } from 'firebase/database';
import { migrateCharacter } from '../utils/migrateCharacter';

const RACES = ['Human', 'Elf', 'Half-Elf', 'Goblin', 'Halfling', 'Sylvari', 'Dracari', 'Orc', 'Dwarf'];
const SEXES = ['M', 'F'];
const AGES = ['Child', 'Adult', 'Elder'];

export default function CharacterEditor() {
  const [character, setCharacter] = useState({
    ...characterTemplate,
    factionAffiliations: [],
    equipment: [],
    tags: []
  });

  const [characterList, setCharacterList] = useState([]);
  const [selectedCharacterKey, setSelectedCharacterKey] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [factionList, setFactionList] = useState([]);
  const [itemList, setItemList] = useState([]);

  useEffect(() => {
    const charRef = ref(db, 'characters/');
    onValue(charRef, (snapshot) => {
      const data = snapshot.val() || {};
      setCharacterList(Object.keys(data));
    });

    const factionRef = ref(db, 'factions/');
    onValue(factionRef, (snapshot) => {
      const data = snapshot.val() || {};
      setFactionList(Object.keys(data));
    });

    const itemRef = ref(db, 'items/');
    onValue(itemRef, (snapshot) => {
      const data = snapshot.val() || {};
      const items = Object.values(data).map(item => item?.itemName || 'Unnamed Item');
      setItemList(items);
    });
  }, []);

  const updateAutoTags = (fields) => {
    const autoTags = [
      fields.race || character.race,
      fields.class || character.class,
      fields.background || character.background,
      fields.age || character.age
    ].filter(Boolean);

    const manualTags = character.tags.filter(tag =>
      !RACES.includes(tag) &&
      !AGES.includes(tag) &&
      !SEXES.includes(tag) &&
      !character.class?.includes(tag) &&
      !character.background?.includes(tag)
    );

    const combinedTags = Array.from(new Set([...manualTags, ...autoTags]));
    setCharacter(prev => ({ ...prev, tags: combinedTags }));
  };

  const handleCharacterSelect = (key) => {
    if (key === 'new') {
      setCharacter({ ...characterTemplate, factionAffiliations: [], equipment: [], tags: [] });
      setSelectedCharacterKey('');
    } else {
      const charRef = ref(db, `characters/${key}`);
      onValue(charRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const migrated = migrateCharacter(data, characterTemplate);
          setCharacter({
            ...migrated,
            equipment: migrated.equipment || [],
            tags: migrated.tags || []
          });
          setSelectedCharacterKey(key);
        }
      }, { onlyOnce: true });
    }
  };

  const handleChange = (field, value) => {
    const updated = { ...character, [field]: value };
    setCharacter(updated);
    updateAutoTags({ [field]: value });
  };

  const handleStatChange = (stat, value) => {
    setCharacter(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: Number(value) }
    }));
  };

  const handleDownload = () => {
    downloadJson(character, `${character.name || 'NewCharacter'}.char.json`);
  };

  const saveCharacterToFirebase = async () => {
    if (!character.name) {
      alert('Please enter a character name before saving.');
      return;
    }

    const characterKey = character.name;
    const charRef = ref(db, `characters/${characterKey}`);
    const counterRef = ref(db, 'counters/characterId');

    let characterToSave = { ...character };

    try {
      const snapshot = await get(charRef);
      const existingCharacter = snapshot.val();

      const dbId = existingCharacter?.id;
      const localId = characterToSave.id;

      const needsNewId = !(Number.isInteger(dbId) && dbId > 0) && !(Number.isInteger(localId) && localId > 0);

      if (needsNewId) {
        const result = await runTransaction(counterRef, (current) => {
          const currentNumber = typeof current === 'number' && !isNaN(current) ? current : 0;
          return currentNumber + 1;
        });

        if (result.committed) {
          characterToSave.id = result.snapshot.val();
        } else {
          alert('Failed to generate unique character ID.');
          return;
        }
      } else if (Number.isInteger(dbId) && dbId > 0) {
        characterToSave.id = dbId;
      }

      await set(charRef, characterToSave);
      setCharacter(characterToSave);
      alert(`Character "${characterToSave.name}" saved with ID ${characterToSave.id}.`);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save character.');
    }
  };

  const handleFactionChange = (index, field, value) => {
    const updated = [...character.factionAffiliations];
    if (!updated[index]) updated[index] = { faction: '', affiliation: 'Neutral', isMember: false };
    updated[index][field] = value;
    setCharacter(prev => ({ ...prev, factionAffiliations: updated }));
  };

  const handleEquipmentChange = (index, value) => {
    const updated = [...character.equipment];
    updated[index] = value;
    setCharacter(prev => ({ ...prev, equipment: updated }));
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !character.tags.includes(trimmed)) {
      setCharacter(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updated = character.tags.filter(tag => tag !== tagToRemove);
    setCharacter(prev => ({ ...prev, tags: updated }));
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h5" gutterBottom>Character Editor</Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Character</InputLabel>
        <Select value={selectedCharacterKey} label="Select Character" onChange={(e) => handleCharacterSelect(e.target.value)}>
          {characterList.map((key) => (
            <MenuItem key={key} value={key}>{key}</MenuItem>
          ))}
          <MenuItem value="new">Create New Character</MenuItem>
        </Select>
      </FormControl>

      <Stack spacing={3}>
        <TextField label="Name" fullWidth value={character.name} onChange={(e) => handleChange('name', e.target.value)} />

        <FormControl fullWidth>
          <InputLabel>Race</InputLabel>
          <Select value={character.race} label="Race" onChange={(e) => handleChange('race', e.target.value)}>
            {RACES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Sex</InputLabel>
          <Select value={character.sex} label="Sex" onChange={(e) => handleChange('sex', e.target.value)}>
            {SEXES.map(s => <MenuItem key={s} value={s}>{s === 'M' ? 'Male' : 'Female'}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Age</InputLabel>
          <Select value={character.age} label="Age" onChange={(e) => handleChange('age', e.target.value)}>
            {AGES.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField label="Class" fullWidth value={character.class} onChange={(e) => handleChange('class', e.target.value)} />
        <TextField label="Background" fullWidth value={character.background || ''} onChange={(e) => handleChange('background', e.target.value)} />
        <TextField label="Description" fullWidth multiline rows={3} value={character.description} onChange={(e) => handleChange('description', e.target.value)} />

        <Typography variant="h6">Stats</Typography>
        <Grid container spacing={2}>
          {Object.keys(character.stats).map(stat => (
            <Grid item xs={6} sm={4} key={stat}>
              <TextField label={stat.toUpperCase()} type="number" fullWidth value={character.stats[stat]} onChange={(e) => handleStatChange(stat, e.target.value)} />
            </Grid>
          ))}
        </Grid>

        <Typography variant="h6" sx={{ mt: 4 }}>Faction Affiliations</Typography>
        {character.factionAffiliations.map((fa, index) => (
          <Grid container spacing={1} key={index} alignItems="center" sx={{ mb: 1 }}>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Faction</InputLabel>
                <Select value={fa.faction} label="Faction" onChange={(e) => handleFactionChange(index, 'faction', e.target.value)}>
                  {factionList.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField label="Affiliation" fullWidth value={fa.affiliation} onChange={(e) => handleFactionChange(index, 'affiliation', e.target.value)} />
            </Grid>
            <Grid item xs={3}>
              <Button variant={fa.isMember ? 'contained' : 'outlined'} fullWidth onClick={() => handleFactionChange(index, 'isMember', !fa.isMember)}>
                {fa.isMember ? 'Member' : 'Not Member'}
              </Button>
            </Grid>
            <Grid item xs={2}>
              <Button variant="outlined" color="error" onClick={() => {
                const updated = character.factionAffiliations.filter((_, i) => i !== index);
                setCharacter(prev => ({ ...prev, factionAffiliations: updated }));
              }}>
                Remove
              </Button>
            </Grid>
          </Grid>
        ))}
        <Button variant="outlined" onClick={() => setCharacter(prev => ({ ...prev, factionAffiliations: [...prev.factionAffiliations, { faction: '', affiliation: 'Neutral', isMember: false }] }))}>Add Faction Affiliation</Button>

        <Typography variant="h6" sx={{ mt: 4 }}>Equipment</Typography>
        {character.equipment.map((item, index) => (
          <Grid container spacing={1} key={index} alignItems="center" sx={{ mb: 1 }}>
            <Grid item xs={10}>
              <Autocomplete
                freeSolo
                options={itemList}
                value={item}
                onInputChange={(event, newValue) => handleEquipmentChange(index, newValue)}
                renderInput={(params) => <TextField {...params} label={`Item ${index + 1}`} fullWidth />}
              />
            </Grid>
            <Grid item xs={2}>
              <Button color="error" variant="outlined" onClick={() => {
                const updated = character.equipment.filter((_, i) => i !== index);
                setCharacter(prev => ({ ...prev, equipment: updated }));
              }}>Remove</Button>
            </Grid>
          </Grid>
        ))}
        <Button variant="outlined" onClick={() => setCharacter(prev => ({ ...prev, equipment: [...prev.equipment, ''] }))}>Add Equipment</Button>

        <Typography variant="h6" sx={{ mt: 4 }}>Tags</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          {character.tags.map(tag => (
            <Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField label="New Tag" size="small" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} />
          <IconButton color="primary" onClick={handleAddTag}><Add /></IconButton>
        </Box>

        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={6}>
            <Button variant="contained" fullWidth onClick={handleDownload}>Download .char JSON</Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant="contained" color="success" fullWidth onClick={saveCharacterToFirebase}>Save to Database</Button>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}
