import { useState, useEffect } from 'react';
import {
  Paper, Typography, Stack, TextField, Grid, Button,
  FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel
} from '@mui/material';
import { db } from '../firebase';
import { ref, onValue, set, remove } from 'firebase/database';
import { spellTemplate } from '../dataModels/spellTemplate';

export default function SpellEditor() {
  const [spellList, setSpellList] = useState([]);
  const [selectedSpellKey, setSelectedSpellKey] = useState('');
  const [spell, setSpell] = useState({ ...spellTemplate });

  useEffect(() => {
    const spellsRef = ref(db, 'spells/');
    onValue(spellsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSpellList(Object.keys(data));
    });
  }, []);

  const handleSpellSelect = (key) => {
    const spellRef = ref(db, `spells/${key}`);
    onValue(spellRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSpell({ ...spellTemplate, ...data });
        setSelectedSpellKey(key);
      }
    }, { onlyOnce: true });
  };

  const handleChange = (field, value) => {
    setSpell(prev => ({ ...prev, [field]: value }));
  };

  const saveSpellToFirebase = async () => {
    const key = spell.spellName.trim();

    if (!key) {
      alert('Please enter a valid spell name.');
      return;
    }

    if (/^\d+$/.test(selectedSpellKey) && selectedSpellKey !== key) {
      const oldRef = ref(db, `spells/${selectedSpellKey}`);
      await remove(oldRef);
    }

    const spellRef = ref(db, `spells/${key}`);
    set(spellRef, spell)
      .then(() => {
        setSelectedSpellKey(key);
        alert(`Spell "${key}" saved successfully.`);
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to save spell.');
      });
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4, width: '100%' }}>
      <Typography variant="h5" gutterBottom>Spell Editor</Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Spell</InputLabel>
        <Select value={selectedSpellKey} label="Select Spell" onChange={(e) => handleSpellSelect(e.target.value)}>
          {spellList.map((key) => (
            <MenuItem key={key} value={key}>{key}</MenuItem>
          ))}
          <MenuItem value="new" onClick={() => {
            setSpell({ ...spellTemplate });
            setSelectedSpellKey('');
          }}>
            Create New Spell
          </MenuItem>
        </Select>
      </FormControl>

      <Stack spacing={3}>
        <TextField label="Spell Name (Key)" fullWidth value={spell.spellName} onChange={(e) => handleChange('spellName', e.target.value)} />
        <TextField label="Description" fullWidth multiline rows={3} value={spell.description} onChange={(e) => handleChange('description', e.target.value)} inputProps={{ spellCheck: false }} />
        <TextField label="Spell Prefab" fullWidth value={spell.spellPrefab} onChange={(e) => handleChange('spellPrefab', e.target.value)} />

        <Grid container spacing={2}>
          <Grid item xs={6}><TextField label="Spell Type" type="number" fullWidth value={spell.spellType} onChange={(e) => handleChange('spellType', parseInt(e.target.value) || 0)} /></Grid>
          <Grid item xs={6}><TextField label="Damage Type" type="number" fullWidth value={spell.damageType} onChange={(e) => handleChange('damageType', parseInt(e.target.value) || 0)} /></Grid>
          <Grid item xs={6}><TextField label="Magic School" type="number" fullWidth value={spell.magicSchool} onChange={(e) => handleChange('magicSchool', parseInt(e.target.value) || 0)} /></Grid>
          <Grid item xs={6}><TextField label="Mana Cost" type="number" fullWidth value={spell.manaCost} onChange={(e) => handleChange('manaCost', parseInt(e.target.value) || 0)} /></Grid>
          <Grid item xs={6}><TextField label="Base Damage" type="number" fullWidth value={spell.baseDamage} onChange={(e) => handleChange('baseDamage', parseInt(e.target.value) || 0)} /></Grid>
          <Grid item xs={6}><TextField label="Heal Amount" type="number" fullWidth value={spell.healAmount} onChange={(e) => handleChange('healAmount', parseInt(e.target.value) || 0)} /></Grid>
          <Grid item xs={6}><TextField label="Base Buff Value" type="number" fullWidth value={spell.baseBuffValue} onChange={(e) => handleChange('baseBuffValue', parseInt(e.target.value) || 0)} /></Grid>
          <Grid item xs={6}><TextField label="Power Scaling" type="number" fullWidth value={spell.powerScaling} onChange={(e) => handleChange('powerScaling', parseFloat(e.target.value) || 0)} /></Grid>
          <Grid item xs={6}><TextField label="Cooldown" type="number" fullWidth value={spell.cooldown} onChange={(e) => handleChange('cooldown', parseFloat(e.target.value) || 0)} /></Grid>
          <Grid item xs={6}><TextField label="Cast Time" type="number" fullWidth value={spell.castTime} onChange={(e) => handleChange('castTime', parseFloat(e.target.value) || 0)} /></Grid>
          <Grid item xs={6}><TextField label="Effect Duration" type="number" fullWidth value={spell.effectDuration} onChange={(e) => handleChange('effectDuration', parseFloat(e.target.value) || 0)} /></Grid>
          <Grid item xs={6}><TextField label="AOE Radius" type="number" fullWidth value={spell.aoeRadius} onChange={(e) => handleChange('aoeRadius', parseFloat(e.target.value) || 0)} /></Grid>
          <Grid item xs={6}><TextField label="Spell Shape" type="number" fullWidth value={spell.spellShape} onChange={(e) => handleChange('spellShape', parseInt(e.target.value) || 0)} /></Grid>
        </Grid>

        <FormControlLabel
          control={<Checkbox checked={spell.requiresLineOfSight} onChange={(e) => handleChange('requiresLineOfSight', e.target.checked)} />}
          label="Requires Line of Sight"
        />

        <FormControlLabel
          control={<Checkbox checked={spell.canBeHeld} onChange={(e) => handleChange('canBeHeld', e.target.checked)} />}
          label="Can Be Held"
        />

        <Button variant="contained" fullWidth onClick={saveSpellToFirebase}>Save Spell</Button>
      </Stack>
    </Paper>
  );
}
