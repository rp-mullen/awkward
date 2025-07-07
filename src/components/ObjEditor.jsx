import { useState, useEffect } from 'react';
import {
  Paper, Typography, Stack, TextField, FormControl, InputLabel, Select, MenuItem,
  Button, Checkbox, FormControlLabel, Autocomplete, Grid
} from '@mui/material';
import { db } from '../firebase';
import { ref, set, onValue } from 'firebase/database';
import { objTemplate } from '../dataModels/objTemplate';
import { downloadJson } from '../utils/downloadJson';

const MATERIALS = ['None', 'Stone', 'Wood', 'Metal', 'Flesh', 'Plant'];
const SUBTYPES = ['None', 'Ruby', 'Sapphire', 'Emerald', 'Diamond', 'Iron', 'Steel', 'Bronze', 'Gold', 'Silver', 'Leather', 'Cloth', 'Bone', 'Bark', 'Glass', 'Crystal', 'Clay'];
const INTERACT_TYPES = ['None', 'Read', 'PickUp', 'Mount', 'Other'];
const DAMAGE_TYPES = ['Blunt', 'Slash', 'Pierce', 'Fire', 'Frost', 'Magic']; // Add your game's damage types here

export default function ObjEditor({ items = [] }) {
  const [objList, setObjList] = useState([]);
  const [selectedObjKey, setSelectedObjKey] = useState('');
  const [obj, setObj] = useState({ ...objTemplate });

  useEffect(() => {
    const objRef = ref(db, 'objects/');
    onValue(objRef, (snapshot) => {
      const data = snapshot.val() || {};
      setObjList(Object.keys(data));
    });
  }, []);

  const handleObjSelect = (key) => {
    if (key === 'new') {
      setObj({ ...objTemplate });
      setSelectedObjKey('');
    } else {
      const objRef = ref(db, `objects/${key}`);
      onValue(objRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setObj(data);
          setSelectedObjKey(key);
        }
      }, { onlyOnce: true });
    }
  };

  const handleChange = (field, value) => {
    setObj(prev => ({ ...prev, [field]: value }));
  };

  const handleResistanceToggle = (resist) => {
    const updated = obj.resistances.includes(resist)
      ? obj.resistances.filter(r => r !== resist)
      : [...obj.resistances, resist];
    setObj(prev => ({ ...prev, resistances: updated }));
  };

  const handleDownload = () => {
    downloadJson(obj, `${obj.objectName || 'Object'}.obj.json`);
  };

  const saveObjToFirebase = () => {
    const key = /^[0-9]+$/.test(obj.objectName) ? obj.associatedItem || 'UnnamedObject' : obj.objectName;
    const objRef = ref(db, `objects/${key}`);
    set(objRef, obj)
      .then(() => alert(`Object "${key}" saved.`))
      .catch((err) => {
        console.error(err);
        alert('Failed to save object.');
      });
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h5" gutterBottom>Object Editor</Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Object</InputLabel>
        <Select value={selectedObjKey} label="Select Object" onChange={(e) => handleObjSelect(e.target.value)}>
          {objList.map((key) => (
            <MenuItem key={key} value={key}>{key}</MenuItem>
          ))}
          <MenuItem value="new">➕ Create New Object</MenuItem>
        </Select>
      </FormControl>

      <Stack spacing={2}>
        <TextField label="Object Name" fullWidth value={obj.objectName} onChange={(e) => handleChange('objectName', e.target.value)} />
        <TextField label="Interaction Prompt" fullWidth value={obj.interactionPrompt} onChange={(e) => handleChange('interactionPrompt', e.target.value)} />

        <FormControl fullWidth>
          <InputLabel>Interact Type</InputLabel>
          <Select value={obj.interactType} label="Interact Type" onChange={(e) => handleChange('interactType', e.target.value)}>
            {INTERACT_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Material</InputLabel>
          <Select value={obj.objMaterial} label="Material" onChange={(e) => handleChange('objMaterial', e.target.value)}>
            {MATERIALS.map(mat => <MenuItem key={mat} value={mat}>{mat}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Subtype</InputLabel>
          <Select value={obj.objMaterialSubtype} label="Subtype" onChange={(e) => handleChange('objMaterialSubtype', e.target.value)}>
            {SUBTYPES.map(sub => <MenuItem key={sub} value={sub}>{sub}</MenuItem>)}
          </Select>
        </FormControl>

        <Autocomplete
          freeSolo
          options={items}
          value={obj.associatedItem}
          onChange={(_, newValue) => handleChange('associatedItem', newValue)}
          renderInput={(params) => <TextField {...params} label="Associated Item" fullWidth />}
        />

        <FormControlLabel
          control={<Checkbox checked={obj.waitForSignal} onChange={(e) => handleChange('waitForSignal', e.target.checked)} />}
          label="Wait for Signal"
        />

        <FormControlLabel
          control={<Checkbox checked={obj.hasHealth} onChange={(e) => handleChange('hasHealth', e.target.checked)} />}
          label="Has Health"
        />

        {obj.hasHealth && (
          <TextField label="Max Health" type="number" fullWidth value={obj.maxHealth} onChange={(e) => handleChange('maxHealth', Number(e.target.value))} />
        )}

        <Typography variant="subtitle2">Resistances:</Typography>
        <Grid container spacing={1}>
          {DAMAGE_TYPES.map(type => (
            <Grid item key={type}>
              <FormControlLabel
                control={<Checkbox checked={obj.resistances.includes(type)} onChange={() => handleResistanceToggle(type)} />}
                label={type}
              />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <Button variant="contained" fullWidth onClick={handleDownload}>Download .obj JSON</Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant="contained" color="success" fullWidth onClick={saveObjToFirebase}>Save to Database</Button>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}
