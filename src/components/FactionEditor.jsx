import { useState, useEffect } from 'react';
import {
  Paper, Typography, Stack, TextField, Grid, Button,
  FormControl, InputLabel, Select, MenuItem, Chip, Box, IconButton
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { factionTemplate } from '../dataModels/factionTemplate';

export default function FactionEditor() {
  const [factionList, setFactionList] = useState([]);
  const [selectedFactionKey, setSelectedFactionKey] = useState('');
  const [faction, setFaction] = useState({ ...factionTemplate, members: [] });
  const [newMemberInput, setNewMemberInput] = useState('');

  useEffect(() => {
    const factionsRef = ref(db, 'factions/');
    onValue(factionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setFactionList(Object.keys(data));
    });
  }, []);

  const handleFactionSelect = (key) => {
    if (key === 'new') {
      setFaction({ ...factionTemplate, members: [], uid: uuidv4() });
      setSelectedFactionKey('');
    } else {
      const factionRef = ref(db, `factions/${key}`);
      onValue(factionRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setFaction({ ...factionTemplate, ...data, members: data.members || [] });
          setSelectedFactionKey(key);
        }
      }, { onlyOnce: true });
    }
  };

  const handleChange = (field, value) => {
    setFaction(prev => ({ ...prev, [field]: value }));
  };

  const handleAddMember = () => {
    const trimmed = newMemberInput.trim();
    if (trimmed && !faction.members.includes(trimmed)) {
      setFaction(prev => ({ ...prev, members: [...prev.members, trimmed] }));
      setNewMemberInput('');
    }
  };

  const handleRemoveMember = (memberToRemove) => {
    setFaction(prev => ({
      ...prev,
      members: prev.members.filter(m => m !== memberToRemove)
    }));
  };

  const saveFactionToFirebase = () => {
    if (!faction.name) {
      alert('Please enter a faction name.');
      return;
    }
  
    const newKey = faction.name.trim();
    const oldKey = selectedFactionKey;
  
    const factionToSave = {
      ...faction,
      uid: faction.uid || uuidv4(),
      members: faction.members || [],
      notes: faction.notes || '',
    };
  
    const newRef = ref(db, `factions/${newKey}`);
  
    const performSave = () => {
      set(newRef, factionToSave)
        .then(() => {
          setSelectedFactionKey(newKey);
          alert(`Faction "${newKey}" saved successfully.`);
        })
        .catch((err) => {
          console.error(err);
          alert('Failed to save faction.');
        });
    };
  
    if (oldKey && oldKey !== newKey) {
      const oldRef = ref(db, `factions/${oldKey}`);
      set(oldRef, null) // delete old record
        .then(performSave)
        .catch((err) => {
          console.error('Failed to delete old faction:', err);
          alert('Failed to remove old faction record.');
        });
    } else {
      performSave();
    }
  };
  

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4, width: '100%' }}>
      <Typography variant="h5" gutterBottom>Faction Editor</Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Faction</InputLabel>
        <Select value={selectedFactionKey} label="Select Faction" onChange={(e) => handleFactionSelect(e.target.value)}>
          {factionList.map((key) => (
            <MenuItem key={key} value={key}>{key}</MenuItem>
          ))}
          <MenuItem value="new">Create New Faction</MenuItem>
        </Select>
      </FormControl>

      <Stack spacing={3}>
        <TextField label="Name" fullWidth value={faction.name} onChange={(e) => handleChange('name', e.target.value)} />
        <TextField label="Description" fullWidth multiline rows={2} value={faction.description} onChange={(e) => handleChange('description', e.target.value)} inputProps={{ spellCheck: false }} />
        <TextField label="Notes" fullWidth multiline rows={2} value={faction.notes} onChange={(e) => handleChange('notes', e.target.value)} inputProps={{ spellCheck: false }} />

        <Typography variant="h6" sx={{ mt: 3 }}>Members</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          {faction.members.map(member => (
            <Chip key={member} label={member} onDelete={() => handleRemoveMember(member)} />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="New Member"
            size="small"
            value={newMemberInput}
            onChange={(e) => setNewMemberInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
          />
          <IconButton color="primary" onClick={handleAddMember}><Add /></IconButton>
        </Box>

        <Button variant="contained" fullWidth sx={{ mt: 3 }} onClick={saveFactionToFirebase}>
          Save Faction
        </Button>
      </Stack>
    </Paper>
  );
}
