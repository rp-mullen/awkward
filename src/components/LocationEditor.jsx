import { useState, useEffect } from 'react';
import {
  Paper, Typography, Stack, TextField, Grid, Button,
  List, ListItem, ListItemText, IconButton, Divider
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import { locationTemplate } from '../dataModels/locationTemplate';

export default function LocationEditor() {
  const [location, setLocation] = useState({ ...locationTemplate, sublocations: [] });
  const [locationList, setLocationList] = useState([]);
  const [selectedLocationKey, setSelectedLocationKey] = useState('');
  const [newSublocation, setNewSublocation] = useState('');

  // Load locations on mount
  useEffect(() => {
    const locRef = ref(db, 'locations/');
    onValue(locRef, (snapshot) => {
      const data = snapshot.val() || {};
      setLocationList(Object.keys(data));
    });
  }, []);

  const handleLocationSelect = (key) => {
    if (key === 'new') {
      setLocation({ ...locationTemplate, sublocations: [] });
      setSelectedLocationKey('');
    } else {
      const locRef = ref(db, `locations/${key}`);
      onValue(locRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const populated = {
            ...locationTemplate,
            ...data,
            uid: data.uid || uuidv4(),
            sublocations: data.sublocations || []
          };
          setLocation(populated);
          setSelectedLocationKey(key);
        }
      }, { onlyOnce: true });
    }
  };

  const handleChange = (field, value) => {
    setLocation(prev => ({ ...prev, [field]: value }));
  };

  const handleSublocationChange = (index, value) => {
    const updated = [...location.sublocations];
    updated[index] = value;
    setLocation(prev => ({ ...prev, sublocations: updated }));
  };

  const handleAddSublocation = () => {
    if (newSublocation.trim()) {
      setLocation(prev => ({ ...prev, sublocations: [...prev.sublocations, newSublocation.trim()] }));
      setNewSublocation('');
    }
  };

  const handleRemoveSublocation = (index) => {
    const updated = location.sublocations.filter((_, i) => i !== index);
    setLocation(prev => ({ ...prev, sublocations: updated }));
  };

  const saveLocationToFirebase = async () => {
    if (!location.name) {
      alert('Please enter a location name before saving.');
      return;
    }

    const locationKey = location.name;
    const locRef = ref(db, `locations/${locationKey}`);

    const locationToSave = {
      ...location,
      uid: location.uid || uuidv4(),
      sublocations: location.sublocations || [],
      version: 1
    };

    await set(locRef, locationToSave);
    alert(`Location "${locationToSave.name}" saved successfully.`);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4, display: 'flex' }}>
      
      {/* Sidebar */}
      <Paper elevation={1} sx={{ width: 250, mr: 4, p: 2 }}>
        <Typography variant="h6">Locations</Typography>
        <List dense>
          {locationList.map(key => (
            <ListItem button key={key} onClick={() => handleLocationSelect(key)}>
              <ListItemText primary={key} />
            </ListItem>
          ))}
          <Divider sx={{ my: 1 }} />
          <ListItem button onClick={() => handleLocationSelect('new')}>
            <ListItemText primary="➕ Create New Location" />
          </ListItem>
        </List>
      </Paper>

      {/* Main Content */}
      <Stack spacing={3} sx={{ flexGrow: 1 }}>
        <TextField
          label="Location Name"
          fullWidth
          value={location.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />

        <TextField
          label="Short Description"
          fullWidth
          multiline
          rows={3}
          value={location.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />

        <TextField
          label="Notes"
          fullWidth
          multiline
          rows={2}
          value={location.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
        />

        <Typography variant="h6">Sublocations</Typography>
        <List dense>
          {location.sublocations.map((sub, index) => (
            <ListItem key={index} secondaryAction={
              <IconButton edge="end" onClick={() => handleRemoveSublocation(index)}>
                <Delete />
              </IconButton>
            }>
              <TextField
                value={sub}
                onChange={(e) => handleSublocationChange(index, e.target.value)}
                size="small"
                fullWidth
              />
            </ListItem>
          ))}
        </List>

        <Grid container spacing={1} alignItems="center">
          <Grid item xs>
            <TextField
              label="New Sublocation"
              value={newSublocation}
              onChange={(e) => setNewSublocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSublocation()}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item>
            <Button variant="outlined" onClick={handleAddSublocation}><Add /></Button>
          </Grid>
        </Grid>

        <Button variant="contained" color="success" onClick={saveLocationToFirebase}>
          Save Location
        </Button>
      </Stack>
    </Paper>
  );
}
